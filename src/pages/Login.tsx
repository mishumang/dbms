import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface LoginForm {
  email: string;
  password: string;
}

interface Errors {
  email?: string;
  password?: string;
}

const Login = () => {
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{ managerId: string, name: string, phoneNumber: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: Errors = {};
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      navigate("/dashboard"); // Redirect after login
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Open Camera
  const startCamera = async () => {
    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  };

  const captureImage = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      
      const scaleFactor = 0.5;
      canvas.width = videoRef.current.videoWidth * scaleFactor;
      canvas.height = videoRef.current.videoHeight * scaleFactor;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          
          const formData = new FormData();
          formData.append("image", blob, "captured.jpg");
  
          setImage(URL.createObjectURL(blob));
  
          try {
            const response = await fetch("http://localhost:5000/api/ocr", {
              method: "POST",
              body: formData, // Sending as FormData (not JSON)
            });
  
            const data = await response.json();
  
            if (!response.ok) {
              throw new Error(data.error || "OCR extraction failed.");
            }
  
            setExtractedData(data);
          } catch (error: any) {
            console.error("[OCR ERROR]", error.message);
            setErrorMessage(error.message);
          }
        }, "image/jpeg");
      }
    }
    stopCamera();
  };
  
  
  
  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-96 bg-white shadow-xl rounded-lg p-6">
        <h2 className="text-center text-2xl font-bold mb-4">Login</h2>
        {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}

        {/* Camera Section */}
        <div className="mb-4">
          {!image ? (
            <>
              <video ref={videoRef} autoPlay className="w-full"></video>
              <button
                type="button"
                onClick={startCamera}
                className="bg-green-500 text-white px-3 py-2 rounded-md mt-2"
              >
                Open Camera
              </button>
              <button
                type="button"
                onClick={captureImage}
                className="bg-blue-500 text-white px-3 py-2 rounded-md mt-2 ml-2"
              >
                Capture ID
              </button>
            </>
          ) : (
            <img src={image} alt="Captured ID" className="mt-2 rounded-md shadow" />
          )}
        </div>

        {/* Display Extracted Data */}
        {extractedData && (
          <div className="bg-gray-200 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold">Extracted ID Details</h3>
            <p><strong>ID:</strong> {extractedData.managerId}</p>
            <p><strong>Name:</strong> {extractedData.name}</p>
            <p><strong>Phone:</strong> {extractedData.phoneNumber}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Sign Up Button */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">Don't have an account?</p>
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
