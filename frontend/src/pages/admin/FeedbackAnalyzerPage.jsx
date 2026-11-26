import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_IFRAME_HEIGHT = 860;

export default function FeedbackAnalyzerPage() {
  const iframeRef = useRef(null);
  const observerRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(DEFAULT_IFRAME_HEIGHT);

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const bodyHeight = doc.body?.scrollHeight || 0;
      const docHeight = doc.documentElement?.scrollHeight || 0;
      const measured = Math.max(bodyHeight, docHeight, DEFAULT_IFRAME_HEIGHT);
      setIframeHeight(measured);
    } catch {
      // Fallback to default height if document height cannot be measured
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    syncIframeHeight();

    observerRef.current?.disconnect();
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!doc?.body || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      syncIframeHeight();
    });
    observer.observe(doc.body);
    observerRef.current = observer;

    // Future integration hook: pass MongoDB feedback fetched from MERN backend API
    // to the embedded analyzer via iframeRef.current?.contentWindow?.postMessage(...)
  }, [syncIframeHeight]);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <section className="card feedback-iframe-card" aria-label="Reports & Analysis">
      <iframe
        ref={iframeRef}
        src="/feedback-analyzer/index.html"
        title="Reports & Analysis"
        className="feedback-iframe"
        style={{ height: `${iframeHeight}px` }}
        onLoad={handleIframeLoad}
      />
    </section>
  );
}
