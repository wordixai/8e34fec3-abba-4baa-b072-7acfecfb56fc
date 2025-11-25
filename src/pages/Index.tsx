import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import html2canvas from 'html2canvas';
import { Download, Trash2, Edit3, RefreshCw } from 'lucide-react';

interface Photo {
  id: string;
  imageUrl: string;
  date: string;
  caption: string;
  position: { x: number; y: number };
  isDeveloping: boolean;
}

const Index = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isEjecting, setIsEjecting] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState<Photo | null>(null);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize webcam
  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Play shutter sound
  const playShutterSound = () => {
    const audio = new Audio('https://www.soundjay.com/mechanical/sounds/camera-shutter-click-01.mp3');
    audio.play().catch(() => console.log('Could not play sound'));
  };

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isEjecting) return;

    playShutterSound();

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to 3:4 ratio
    canvas.width = 300;
    canvas.height = 400;

    // Draw video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL('image/png');
    const date = new Date().toLocaleDateString(navigator.language || 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const newPhoto: Photo = {
      id: Date.now().toString(),
      imageUrl,
      date,
      caption: '',
      position: { x: 0, y: 0 },
      isDeveloping: true,
    };

    setCurrentPhoto(newPhoto);
    setIsEjecting(true);

    // Generate caption with AI
    setTimeout(() => {
      generateCaption(newPhoto);
    }, 1000);

    // End ejection animation and develop photo
    setTimeout(() => {
      setIsEjecting(false);
    }, 2000);
  };

  // Generate caption using Gemini
  const generateCaption = async (photo: Photo, regenerate = false) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDwVGhxirgBjYmn5VruhBFZCsKJg-dxMxM';
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const userLang = navigator.language || 'en';
      const prompt = `Generate a warm, short blessing or nice comment (1-2 sentences max) about this photo in ${userLang} language. Be creative and heartfelt.`;

      const imageParts = [
        {
          inlineData: {
            data: photo.imageUrl.split(',')[1],
            mimeType: 'image/png',
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const caption = response.text();

      if (regenerate) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, caption } : p))
        );
      } else {
        setCurrentPhoto((prev) => (prev ? { ...prev, caption } : null));
      }

      // Finish developing
      setTimeout(() => {
        if (regenerate) {
          setPhotos((prev) =>
            prev.map((p) => (p.id === photo.id ? { ...p, isDeveloping: false } : p))
          );
        } else {
          setCurrentPhoto((prev) => (prev ? { ...prev, isDeveloping: false } : null));
        }
      }, 3000);
    } catch (error) {
      console.error('Error generating caption:', error);
      const fallbackCaption = 'A moment captured forever ✨';

      if (regenerate) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photo.id ? { ...p, caption: fallbackCaption, isDeveloping: false } : p))
        );
      } else {
        setCurrentPhoto((prev) => (prev ? { ...prev, caption: fallbackCaption, isDeveloping: false } : null));
      }
    }
  };

  // Start dragging photo
  const handlePhotoMouseDown = (e: React.MouseEvent, photoId: string) => {
    const photo = currentPhoto?.id === photoId ? currentPhoto : photos.find((p) => p.id === photoId);
    if (!photo) return;

    setDraggedPhoto(photoId);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - (photo.position.x || rect.left),
      y: e.clientY - (photo.position.y || rect.top),
    });
  };

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedPhoto) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        if (currentPhoto?.id === draggedPhoto) {
          setCurrentPhoto((prev) =>
            prev ? { ...prev, position: { x: newX, y: newY } } : null
          );
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === draggedPhoto ? { ...p, position: { x: newX, y: newY } } : p
            )
          );
        }
      }
    };

    const handleMouseUp = () => {
      if (draggedPhoto && currentPhoto?.id === draggedPhoto) {
        // Move from camera to wall
        setPhotos((prev) => [...prev, currentPhoto]);
        setCurrentPhoto(null);
      }
      setDraggedPhoto(null);
    };

    if (draggedPhoto) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPhoto, dragOffset, currentPhoto]);

  // Delete photo
  const deletePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Download photo
  const downloadPhoto = async (photoId: string) => {
    const element = document.getElementById(`photo-${photoId}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `retro-photo-${photoId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  };

  // Edit caption
  const startEditing = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditText(photo.caption);
  };

  const saveEdit = () => {
    if (editingPhotoId) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === editingPhotoId ? { ...p, caption: editText } : p))
      );
      setEditingPhotoId(null);
    }
  };

  const cancelEdit = () => {
    setEditingPhotoId(null);
    setEditText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const renderPhoto = (photo: Photo, isOnCamera = false) => {
    const isEditing = editingPhotoId === photo.id;
    const isHovered = hoveredPhoto === photo.id;
    const isTextHovered = hoveredText === photo.id;

    const style = isOnCamera
      ? {
          transform: `translateX(-50%) translateY(${isEjecting ? '-40%' : '0'})`,
          transition: 'transform 1s ease-out',
        }
      : {
          left: `${photo.position.x}px`,
          top: `${photo.position.y}px`,
        };

    return (
      <div
        key={photo.id}
        id={`photo-${photo.id}`}
        className={`${isOnCamera ? 'absolute top-0 left-1/2 w-[35%] h-full' : 'absolute'} cursor-move select-none`}
        style={isOnCamera ? style : { ...style, zIndex: draggedPhoto === photo.id ? 1000 : 10 }}
        onMouseDown={(e) => handlePhotoMouseDown(e, photo.id)}
        onMouseEnter={() => setHoveredPhoto(photo.id)}
        onMouseLeave={() => setHoveredPhoto(null)}
      >
        {/* Toolbar */}
        {isHovered && !isOnCamera && !photo.isDeveloping && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-2 bg-card p-2 rounded-lg shadow-lg z-50">
            <button
              onClick={() => downloadPhoto(photo.id)}
              className="p-2 hover:bg-muted rounded transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => deletePhoto(photo.id)}
              className="p-2 hover:bg-destructive/10 rounded transition-colors text-destructive"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Polaroid Card */}
        <div className="bg-card shadow-2xl p-3 pb-12 w-full">
          <div className="relative w-full pb-[133%] bg-muted overflow-hidden">
            <img
              src={photo.imageUrl}
              alt="Captured moment"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-3000 ${
                photo.isDeveloping ? 'blur-xl opacity-30' : 'blur-0 opacity-100'
              }`}
              style={{
                transition: 'filter 3s ease-in-out, opacity 3s ease-in-out',
              }}
            />
          </div>

          {/* Caption and Date */}
          <div className="mt-3 space-y-1">
            <div className="text-sm text-muted-foreground">{photo.date}</div>

            <div
              className="relative min-h-[3rem] group"
              onMouseEnter={() => setHoveredText(photo.id)}
              onMouseLeave={() => setHoveredText(null)}
              onDoubleClick={() => !isOnCamera && startEditing(photo)}
            >
              {isEditing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="w-full p-2 text-base bg-input border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={3}
                  autoFocus
                />
              ) : (
                <>
                  <div className="text-base leading-relaxed">{photo.caption}</div>

                  {/* Text Edit Icons */}
                  {isTextHovered && !isOnCamera && !photo.isDeveloping && (
                    <div className="absolute -right-12 top-0 flex flex-col gap-2">
                      <button
                        onClick={() => startEditing(photo)}
                        className="p-1.5 bg-card hover:bg-muted rounded shadow-lg transition-colors"
                        title="Edit caption"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateCaption(photo, true)}
                        className="p-1.5 bg-card hover:bg-muted rounded shadow-lg transition-colors"
                        title="Regenerate caption"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Title */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30">
        <h1 className="text-6xl font-bold text-foreground">Bao Retro Camera</h1>
      </div>

      {/* Instructions */}
      <div className="fixed bottom-8 right-8 z-30 bg-card p-4 rounded-lg shadow-lg max-w-xs">
        <h3 className="text-xl font-bold mb-2">How to use:</h3>
        <ol className="text-lg space-y-1 list-decimal list-inside">
          <li>Click the camera button to take a photo</li>
          <li>Drag the photo to the wall</li>
          <li>Hover over text to edit or regenerate</li>
          <li>Hover over photo for download/delete</li>
        </ol>
      </div>

      {/* Photo Wall - Rendered Photos */}
      {photos.map((photo) => renderPhoto(photo))}

      {/* Camera Container */}
      <div className="fixed bottom-16 left-16 w-[450px] h-[450px] z-20">
        {/* Camera Background Image */}
        <img
          src="https://s.baoyu.io/images/retro-camera.webp"
          alt="Retro Camera"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ left: 0, bottom: 0 }}
        />

        {/* Video Viewfinder */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute rounded-full object-cover"
          style={{
            bottom: '32%',
            left: '62%',
            transform: 'translateX(-50%)',
            width: '27%',
            height: '27%',
            zIndex: 30,
          }}
        />

        {/* Shutter Button (Invisible Clickable Area) */}
        <button
          onClick={capturePhoto}
          className="absolute cursor-pointer bg-transparent border-0 hover:bg-primary/10 rounded-full transition-all"
          style={{
            bottom: '40%',
            left: '18%',
            width: '11%',
            height: '11%',
            zIndex: 30,
          }}
          aria-label="Take Photo"
        />

        {/* Photo Ejection Slot - Current Photo */}
        {currentPhoto && (
          <div
            className="absolute"
            style={{
              transform: 'translateX(-50%)',
              top: 0,
              left: '50%',
              width: '35%',
              height: '100%',
              zIndex: 10,
            }}
          >
            {renderPhoto(currentPhoto, true)}
          </div>
        )}
      </div>

      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Index;
