"""Owner-requested collage preview. Independent paper layers; preserves existing narration/subtitles."""
from PIL import Image,ImageDraw,ImageFont,ImageOps
import math,subprocess,pathlib,random
W,H,FPS=720,1280,30
OUT=pathlib.Path('/opt/stadione-editorial/hilgers-vox-revision');OUT.mkdir(exist_ok=True)
CREAM='#eee9dd';RED='#84102d';INK='#191714'
font='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
photo=Image.open('/opt/stadione-editorial/evening-20261119/hilgers-original.jpg').convert('RGB')
def label(text,size,bg=INK,fg=CREAM,pad=16):
 f=ImageFont.truetype(font,size);b=f.getbbox(text);im=Image.new('RGBA',(b[2]+pad*2,b[3]-b[1]+pad*2),bg);ImageDraw.Draw(im).text((pad,pad-b[1]),text,font=f,fill=fg);return im

def paper_photo(size):
 im=ImageOps.fit(photo,size,centering=(.55,.4)).convert('RGBA');mask=Image.new('L',size,0);d=ImageDraw.Draw(mask);r=random.Random(size[0]);ww,hh=size
 pts=[(x,r.randrange(3,17))for x in range(0,ww,24)]+[(ww-1,y)for y in range(0,hh,24)]+[(x,hh-r.randrange(3,17))for x in range(ww-1,-1,-24)]+[(0,y)for y in range(hh-1,-1,-24)]
 d.polygon(pts,fill=255);im.putalpha(mask);return im
photos=[paper_photo((510,560)),paper_photo((380,445)),paper_photo((455,510))]
titles=[[label('BAGI HILGERS,',40),label('INI BERARTI',48,RED),label('KEMBALI.',74)], [label('AKAR.',70,RED),label('DARAH.',70),label('HATI.',70,RED)], [label('DULU ABSEN.',46),label('KINI DIPANGGIL.',42,RED)]]
small=[label('UJI COBA / MAKNA BESAR',20,CREAM,INK),label('IKATAN DENGAN INDONESIA',19,CREAM,INK),label('KEMBALI MASUK SKUAD',22,CREAM,INK)]
brand=label('STADIONE',23,CREAM,INK);source=label('Sumber: Mees Hilgers · SC Heerenveen',12,CREAM,INK,pad=4)
def paste(canvas,obj,x,y,angle=0):
 r=obj.rotate(angle,resample=Image.Resampling.BICUBIC,expand=True);canvas.alpha_composite(r,(int(x),int(y)))
def ease(t,delay):
 x=max(0,min(1,(t-delay)/.52));return 1-(1-x)**3

def frame(time):
 idx=0 if time<10 else 1 if time<18.36 else 2;t=time-[0,10,18.36][idx]
 im=Image.new('RGBA',(W,H),CREAM);d=ImageDraw.Draw(im)
 # Fixed paper grain and halftone, never random per frame.
 for y in range(120,1120,18):
  for x in range(455,710,18):d.ellipse((x,y,x+2,y+2),fill='#cfc7b7')
 d.polygon([(0,570),(720,490),(720,1010),(0,1065)],fill=RED if idx!=1 else '#d6cbb7')
 paste(im,brand,34,42);d.line((34,103,686,103),fill=INK,width=2)
 if idx==0:
  for j,obj in enumerate(titles[idx]):paste(im,obj,35-780*(1-ease(t,j*.17)),145+j*95,[-2,1,-1][j])
  paste(im,photos[idx],105+780*(1-ease(t,.4)),440+3*math.sin(t),-4)
  paste(im,small[idx],38,970+300*(1-ease(t,.85)),2)
 elif idx==1:
  paste(im,photos[idx],30-650*(1-ease(t,.05)),178,4)
  for j,obj in enumerate(titles[idx]):paste(im,obj,325+700*(1-ease(t,.18+j*.2)),540+j*112,[-3,2,-2][j])
  paste(im,small[idx],32,965,0)
 else:
  for j,obj in enumerate(titles[idx]):paste(im,obj,34-780*(1-ease(t,j*.25)),155+j*95,[-2,1][j])
  paste(im,photos[idx],155+650*(1-ease(t,.25)),410,-4)
  # Selection timeline is conceptual, not fabricated match data.
  d.line((60,380,60,890),fill=CREAM,width=4)
  for j,txt in enumerate(['ABSEN','KEMBALI']):
   yy=510+j*300;d.ellipse((49,yy,71,yy+22),fill=CREAM);paste(im,label(txt,18,INK),30,yy+36)
  paste(im,small[idx],55,963,2)
 paste(im,source,34,112)
 paste(im,label('Foto arsip 2022 · Hans Reefman / Wikimedia',10,CREAM,INK,pad=4),34,1250)
 return im.convert('RGB')
for n,t in enumerate([2,12,21]):frame(t).save(OUT/f'preview-{n+1}.jpg',quality=90)
p=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',str(OUT/'visual.mp4')],stdin=subprocess.PIPE)
for n in range(math.ceil(31.758*FPS)):p.stdin.write(frame(n/FPS).tobytes())
p.stdin.close()
if p.wait()!=0:raise RuntimeError('Visual render failed')
# Reuse real Tara DFS narration/music and exact existing phrase subtitle strip.
subprocess.run(['ffmpeg','-y','-v','error','-i',str(OUT/'visual.mp4'),'-i','/opt/stadione-editorial/hilgers-motion-newformat-preview.mp4','-filter_complex','[1:v]crop=972:340:54:1410,scale=648:227[sub];[0:v][sub]overlay=36:1015[v]','-map','[v]','-map','1:a:0','-t','31.758','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(OUT/'hilgers-paper-collage.mp4')],check=True)
print('Rendered',OUT/'hilgers-paper-collage.mp4')
