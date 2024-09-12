import React from 'react';
import Form from '../components/Form';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const handleLogin = () => {
    console.log("Login button clicked");
    // Add your login logic here
  };

  const navigate = useNavigate();

  return (
    <div className="flex w-full h-screen">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white">
        <Form
          title="Login"
          buttonText="Sign In"
          buttonAction={handleLogin}
          secondButtonText="Sign Up"
          secondButtonAction={() => navigate('/sign-up')}
          
        />
      </div>
      
      {/* Background Section */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gray-200">
        <div className="w-60 h-60 bg-gradient-to-tr from-violet-500 to-pink-500 rounded-full animate-bounce flex items-center justify-center">
          <img 
            alt="Company Logo" 
            src="https://musts.io/assets/images/content/logo-1.png" 
            className="w-3/4 h-3/4 object-contain"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white/10 backdrop-blur-lg" />
      </div>
    </div>
  );
}
