import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Download, X, Image as ImageIcon, RefreshCw } from 'lucide-react';

const PhotoboothApp = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [selectedFrame, setSelectedFrame] = useState('black');
  const [selectedTheme, setSelectedTheme] = useState('none');
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  
  const frameColors = {
    black: '#000000',
    pink: '#FF69B4',
    green: '#4CAF50',
    blue: '#2196F3',
    yellow: '#FFEB3B',
    purple: '#9C27B0'
  };
  
  const stickerSets = {
    girlypop: [
      '/api/placeholder/50/50',
      '/api/placeholder/50/50',
      '/api/placeholder/50/50'
    ],
    cute: [
      '/api/placeholder/50/50',
      '/api/placeholder/50/50',
      '/api/placeholder/50/50'
    ],
    none: []
  };
  
  useEffect(() => {
    return () => {
      // Clean up video stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin atau coba gunakan fitur unggah gambar.');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      setImageUrl(canvasRef.current.toDataURL('image/png'));
      stopCamera();
      setShowConfirmation(true);
    }
  };
  
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target.result);
        setShowConfirmation(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const resetImage = () => {
    setImageUrl(null);
    setShowConfirmation(false);
    setSelectedFrame('black');
    setSelectedTheme('none');
  };
  
  const downloadImage = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const image = new Image();
      
      image.onload = () => {
        // Create a larger canvas for the photo strip
        const stripWidth = image.width + 40; // Add padding for frame
        const stripHeight = image.height + 100; // Add space for title and bottom
        
        canvasRef.current.width = stripWidth;
        canvasRef.current.height = stripHeight;
        
        // Draw frame
        context.fillStyle = frameColors[selectedFrame];
        context.fillRect(0, 0, stripWidth, stripHeight);
        
        // Draw white background for photo area
        context.fillStyle = '#FFFFFF';
        context.fillRect(20, 60, image.width, image.height);
        
        // Draw the image
        context.drawImage(image, 20, 60);
        
        // Add title
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText('Photobooth', stripWidth / 2, 35);
        
        // Add date
        const date = new Date().toLocaleDateString();
        context.fillStyle = '#FFFFFF';
        context.font = '14px Arial';
        context.textAlign = 'center';
        context.fillText(date, stripWidth / 2, stripHeight - 25);
        
        // Add stickers if theme is selected
        if (selectedTheme !== 'none') {
          // This would normally add stickers, but we're using placeholders for now
          const stickerX = stripWidth - 70;
          const stickerY = stripHeight - 70;
          
          context.fillStyle = '#FFFFFF';
          context.beginPath();
          context.arc(stickerX, stickerY, 25, 0, Math.PI * 2);
          context.fill();
          
          context.fillStyle = frameColors[selectedFrame];
          context.font = 'bold 12px Arial';
          context.textAlign = 'center';
          context.fillText(selectedTheme, stickerX, stickerY + 4);
        }
        
        // Create a download link
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'photobooth-' + Date.now() + '.png';
        link.href = dataUrl;
        link.click();
      };
      
      image.src = imageUrl;
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Photobooth Interaktif</h1>
      
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        {!imageUrl && !cameraActive && (
          <div className="flex flex-col items-center justify-center space-y-6 py-12">
            <h2 className="text-xl font-semibold mb-4">Pilih Sumber Gambar</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={startCamera} 
                className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Camera size={20} />
                <span>Gunakan Kamera</span>
              </button>
              
              <button 
                onClick={triggerFileInput} 
                className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Upload size={20} />
                <span>Unggah Gambar</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
        )}
        
        {cameraActive && (
          <div className="flex flex-col items-center">
            <div className="relative mb-4 rounded-lg overflow-hidden border-4 border-gray-300">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ maxWidth: '100%', maxHeight: '60vh' }} 
                className="rounded-lg"
              ></video>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={captureImage} 
                className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Camera size={20} />
                <span>Ambil Foto</span>
              </button>
              
              <button 
                onClick={stopCamera} 
                className="flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <X size={20} />
                <span>Batal</span>
              </button>
            </div>
          </div>
        )}
        
        {imageUrl && showConfirmation && (
          <div className="flex flex-col items-center">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-center">Sesuaikan Foto Anda</h2>
              
              <div className="relative mb-6 rounded-lg overflow-hidden border-4" style={{ borderColor: frameColors[selectedFrame] }}>
                <img 
                  src={imageUrl} 
                  alt="Captured" 
                  style={{ maxWidth: '100%', maxHeight: '40vh' }} 
                  className="rounded-lg"
                />
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Pilih Warna Bingkai:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.entries(frameColors).map(([color, hex]) => (
                    <button
                      key={color}
                      onClick={() => setSelectedFrame(color)}
                      className={`w-10 h-10 rounded-full transition duration-200 ${selectedFrame === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''}`}
                      style={{ backgroundColor: hex }}
                      aria-label={`Bingkai ${color}`}
                    ></button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Pilih Tema Stiker:</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => setSelectedTheme('none')}
                    className={`px-4 py-2 rounded-lg transition duration-200 ${selectedTheme === 'none' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
                  >
                    Tanpa Stiker
                  </button>
                  <button
                    onClick={() => setSelectedTheme('girlypop')}
                    className={`px-4 py-2 rounded-lg transition duration-200 ${selectedTheme === 'girlypop' ? 'bg-pink-500 text-white' : 'bg-pink-100'}`}
                  >
                    Girlypop
                  </button>
                  <button
                    onClick={() => setSelectedTheme('cute')}
                    className={`px-4 py-2 rounded-lg transition duration-200 ${selectedTheme === 'cute' ? 'bg-purple-500 text-white' : 'bg-purple-100'}`}
                  >
                    Cute
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={downloadImage} 
                className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <Download size={20} />
                <span>Unduh Foto</span>
              </button>
              
              <button 
                onClick={resetImage} 
                className="flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition duration-200"
              >
                <RefreshCw size={20} />
                <span>Mulai Ulang</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden"></canvas>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Photobooth App - Dibuat dengan React
      </footer>
    </div>
  );
};

export default PhotoboothApp;
