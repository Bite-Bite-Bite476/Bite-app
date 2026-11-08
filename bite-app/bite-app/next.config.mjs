/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Agrega aquí el host donde subirás las fotos de producto en producción,
      // por ejemplo Vercel Blob ({proyecto}.public.blob.vercel-storage.com)
      // o tu bucket de S3/Cloudinary.
    ]
  }
};

export default nextConfig;
