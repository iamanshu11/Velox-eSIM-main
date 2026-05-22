import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-linear-to-br from-primary-300 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-linear-to-br from-primary-300 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-0">
        <div className="mb-8">
          <h1 className="text-9xl md:text-[200px] font-black text-gray-900 drop-shadow-lg">
            404
          </h1>
        </div>

        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            The page you&apos;re looking for has traveled to another dimension.
          </p>
          <p className="text-gray-600 mb-8">
            Let&apos;s get you back to the right place.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-gray-900 text-white! rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg"
            >
              Go Home
            </Link>
            <Link
              href="/esim"
              className="px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-bold hover:bg-gray-50 transition-colors"
            >
              Browse Plans
            </Link>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 opacity-20">
          <div className="flex gap-4 text-8xl">
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>📡</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>404</span>
            <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>📶</span>
          </div>
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white/20 pointer-events-none" />
    </div>
  );
}




