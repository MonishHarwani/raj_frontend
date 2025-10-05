import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Camera, Users, Briefcase, Star } from "lucide-react";

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-100">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="flex items-center justify-center w-20 h-20 bg-primary-600 rounded-2xl shadow-lg">
                <Camera className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Connect. Create. Capture.
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
              The premier platform for photographers and clients to connect,
              collaborate, and create amazing work together.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Free
                  </Link>
                  <Link to="/posts" className="btn btn-secondary btn-lg">
                    Browse Portfolio
                  </Link>
                </>
              ) : (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to grow your photography business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From portfolio showcase to client management, we provide all the
              tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card card-hover text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Camera className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Showcase Work
              </h3>
              <p className="text-gray-600">
                Create stunning portfolios with unlimited photo uploads and
                professional galleries.
              </p>
            </div>

            <div className="card card-hover text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Find Jobs
              </h3>
              <p className="text-gray-600">
                Connect with clients looking for photographers for weddings,
                events, and commercial projects.
              </p>
            </div>

            <div className="card card-hover text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Build Network
              </h3>
              <p className="text-gray-600">
                Chat with clients, collaborate with other photographers, and
                grow your professional network.
              </p>
            </div>

            <div className="card card-hover text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Reviews
              </h3>
              <p className="text-gray-600">
                Build your reputation with client reviews and ratings to attract
                more business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-primary-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to start your photography journey?
            </h2>
            <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
              Join thousands of photographers already using our platform to grow
              their business
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-100"
              >
                Join as Photographer
              </Link>
              <Link
                to="/register"
                className="btn border-white text-white hover:bg-white hover:text-primary-600"
              >
                Join as Client
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
