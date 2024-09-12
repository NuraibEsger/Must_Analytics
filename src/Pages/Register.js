import React from "react";
import { useNavigate } from "react-router-dom";
import Form from "../components/Form";

export default function Register() {
  const navigate = useNavigate();

  // Function to handle sending email
  const handleSendEmail = () => {
    console.log("Send email clicked!");
    // You can add your email-sending logic here
  };

  return (
    <div className="flex w-full h-screen">
      <div className="w-full flex items-center justify-center lg:w-1/2 bg-white">
        <Form
          title="Get started with MustSoftware"
          emailOnly={true} // Only show the email input
          buttonText="Send Email"
          buttonAction={handleSendEmail} // Send email logic
          secondButtonText="Go Back"
          secondButtonAction={() => navigate('/sign-in')} // Go back action
        />
      </div>
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
