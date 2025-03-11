/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable static exports for better performance
    output: 'standalone',
    // Configure headers for WebAssembly and SharedArrayBuffer support
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cross-Origin-Opener-Policy',
                        value: 'same-origin',
                    },
                    {
                        key: 'Cross-Origin-Embedder-Policy',
                        value: 'require-corp',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig; 