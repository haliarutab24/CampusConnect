import React, { useContext, useRef } from "react";
import { Search, MapPin } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";
// REMOVED: framer-motion and SlideUp imports

// Import Swiper components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Hero = () => {
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const locationRef = useRef(null);

  const { setSearchFilter, setIsSearched } = useContext(AppContext);

  const sliderImages = [
    "https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg",
    "https://images.pexels.com/photos/159490/yale-university-landscape-universities-schools-159490.jpeg",
    "https://images.pexels.com/photos/1205651/pexels-photo-1205651.jpeg",
    "https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg",
    "https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg",
  ];

  const searchHandler = (e) => {
    e.preventDefault();
    setSearchFilter({
      title: titleRef.current.value,
      location: locationRef.current.value,
    });
    setIsSearched(true);
    if (titleRef.current.value || locationRef.current.value) {
      navigate("/all-jobs/all");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-lg">
      {/* Image Slider */}
      <div className="absolute inset-0 z-0">
        <Swiper
          modules={[Autoplay, Navigation, Pagination]}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          className="h-full w-full"
        >
          {sliderImages.map((image, index) => (
            <SwiperSlide key={index}>
              <div 
                className="h-full w-full bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${image})`
                }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      {/* Content */}
      <div className="relative z-10 py-20 px-6 md:px-20">
        <div className="text-center max-w-2xl mx-auto">
          {/* Changed from motion.h1 to regular h1 */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight sm:leading-snug drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
            CampusConnect: <span className="text-blue-400">University Talent Finder</span>
          </h1>

          {/* Changed from motion.p to regular p */}
          <p className="text-gray-200 mb-10 text-lg font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
            Discover opportunities, connect with talent, and collaborate on projects
            within your university community.
          </p>

          {/* Changed from motion.form to regular form */}
          <form
            onSubmit={searchHandler}
            className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 p-4 flex flex-col sm:flex-row gap-4 sm:gap-2 items-stretch sm:items-center w-full transition-all duration-300"
          >
            {/* Job Title Input */}
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 md:py-2.5 bg-white w-full shadow-inner">
              <Search className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                name="job"
                placeholder="Search opportunities"
                aria-label="Title"
                autoComplete="on"
                className="w-full outline-none text-sm bg-transparent placeholder-gray-500"
                ref={titleRef}
              />
            </div>

            {/* Location Input */}
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 md:py-2.5 bg-white w-full shadow-inner">
              <MapPin className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                name="location"
                placeholder="Department or location"
                aria-label="Location"
                autoComplete="on"
                className="w-full outline-none text-sm bg-transparent placeholder-gray-500"
                ref={locationRef}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 md:py-3 px-6 rounded-md transition text-sm cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;