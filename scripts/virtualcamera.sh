sudo modprobe -r v4l2loopback
sudo modprobe v4l2loopback devices=1 video_nr=21 exclusive_caps=1 card_label="Virtual Webcam"
sudo modprobe v4l2loopback exclusive_caps=1
ffmpeg -re -stream_loop -1 -i /home/nguyendang/Videos/parrot2.mp4 -map 0:v -f v4l2 /dev/video21
