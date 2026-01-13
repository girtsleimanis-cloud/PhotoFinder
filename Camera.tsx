
import React, { useRef, useState, useEffect } from 'react';

interface CameraProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        setError("Nevar piekļūt kamerai. Lūdzu, pārbaudiet atļaujas.");
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {error ? (
          <div className="text-white p-4 text-center">{error}</div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="bg-slate-900 p-6 flex justify-around items-center">
        <button 
          onClick={onCancel}
          className="text-white bg-slate-700 px-4 py-2 rounded-full font-medium"
        >
          Atpakaļ
        </button>
        <button 
          onClick={handleCapture}
          className="w-16 h-16 bg-white border-4 border-slate-300 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full border-2 border-slate-900"></div>
        </button>
        <div className="w-16"></div> {/* Spacer for symmetry */}
      </div>
    </div>
  );
};

export default Camera;
