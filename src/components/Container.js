import React from 'react';

const Card = () => {
    return (
        <div className='flex justify-center'>
            <div className="flex justify-center col-span-1 mb-4 md:mb-6 transition-transform transform hover:-translate-y-1">
                <a
                    href="/labeling/66e18eaff4df410031a074d1"
                    className="p-6 h-full flex flex-row items-center transition duration-300 rounded-lg shadow-lg bg-white hover:shadow-2xl"
                >
                    {/* Icon Section */}
                    <div className="flex-shrink-0 bg-purple-500 text-white rounded-full p-3 mr-6">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10">
                            <path d="M20.7 4.1C18.7 4.8 15.9 5.5 12 5.5C8.1 5.5 5.1 4.7 3.3 4.1C2.7 3.8 2 4.3 2 5V19C2 19.7 2.7 20.2 3.3 20C5.4 19.3 8.1 18.5 12 18.5C15.9 18.5 18.7 19.3 20.7 20C21.4 20.2 22 19.7 22 19V5C22 4.3 21.3 3.8 20.7 4.1M12 15C9.7 15 7.5 15.1 5.5 15.4L9.2 11L11.2 13.4L14 10L18.5 15.4C16.5 15.1 14.3 15 12 15Z" />
                        </svg>
                    </div>

                    {/* Text Content Section */}
                    <div className="flex flex-col justify-between w-full">
                        <div>
                            <h2 className="font-bold text-lg md:text-xl leading-tight line-clamp-2">
                                Image Classification Project
                            </h2>
                            <p className="text-sm text-gray-500 line-clamp-2 my-2">
                                Detailed description of the project with necessary information.
                            </p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center mb-4">
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mr-2">
                                Machine Learning
                            </span>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                AI
                            </span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center">
                                <div className="bg-purple-500 text-white rounded-full h-7 w-7 flex items-center justify-center font-bold">
                                    MM
                                </div>
                            </div>
                            <small className="text-gray-500 flex items-center">
                                11 September 2024
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    className="inline-block ml-1 w-4 h-4"
                                >
                                    <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z" />
                                </svg>
                            </small>
                        </div>
                    </div>
                </a>
            </div>
        </div>
    );
};

export default Card;
