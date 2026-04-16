export default function RootLayout() {
  useFrameworkReady();

  // Pretendard 웹폰트 로드 (웹 전용)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('pretendard-font')) {
        const link = document.createElement('link');
        link.id = 'pretendard-font';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
        document.head.appendChild(link);
      }

      if (!document.getElementById('matchmarket-global-style')) {
        const style = document.createElement('style');
        style.id = 'matchmarket-global-style';
        style.innerHTML = `
          html, body, #root, #__next {
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          * {
            font-family: inherit;
          }
          input, textarea, select, button {
            font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  // Service Worker 등록 로직
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // ... 기존 코드 그대로