import React from "react";

export default function Form({
  title,
  buttonText,
  emailOnly = false, // Optional prop to conditionally render only the email input
  buttonAction,
  secondButtonText,
  secondButtonAction,
}) {
  return (
    <div className="bg-white px-10 py-20 rounded-3xl border-2 border-x-gray-200">
      <h1 className="text-5xl font-semibold">{title}</h1>
      <p className="font-medium text-lg text-gray-500 mt-4">
        Sign up and discover a great amount of new opportunities
      </p>
      <div className="mt-8">
        <div>
          <label className="text-lg font-medium">Email</label>
          <input
            className="w-full border-2 border-gray-100 rounded-xl p-4 mt-1 bg-transparent"
            placeholder="Enter your email"
          />
        </div>
        
        {/* Conditionally render the password field if not emailOnly */}
        {!emailOnly && (
          <div>
            <label className="text-lg font-medium">Password</label>
            <input
              className="w-full border-2 border-gray-100 rounded-xl p-4 mt-1 bg-transparent"
              placeholder="Enter your password"
              type="password"
            />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-y-4">
          <button
            className="active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-violet-500 text-white text-lg font-bold"
            onClick={buttonAction}
          >
            {buttonText}
          </button>
        </div>

        {secondButtonText && (
          <div className="mt-4 flex flex-col gap-y-4">
            <button
              className="active:scale-[.98] active:duration-75 hover:scale-[1.01] ease-in-out transition-all py-3 rounded-xl bg-gray-200 text-gray-800 text-lg font-semibold"
              onClick={secondButtonAction}
            >
              {secondButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
