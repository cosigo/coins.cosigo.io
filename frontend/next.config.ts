const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.cosigo.io",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
