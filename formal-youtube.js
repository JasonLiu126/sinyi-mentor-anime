let publicTrainingYouTubeApi;

function loadPublicTrainingYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (publicTrainingYouTubeApi) return publicTrainingYouTubeApi;
  publicTrainingYouTubeApi = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    const timer = setTimeout(() => reject(new Error('YouTube API timeout')), 8000);
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('YouTube API unavailable'));
    };
    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timer);
      resolve(window.YT);
    };
    document.head.append(script);
  }).catch(error => {
    publicTrainingYouTubeApi = null;
    throw error;
  });
  return publicTrainingYouTubeApi;
}

function mountPublicTrainingVideo(container, videoId, { onReady, onError, onIncomplete, onComplete }) {
  let player;
  let interval;
  let readyTimer;
  let disposed = false;
  let furthest = 0;
  let lastTime;
  let lastSample;
  function trackPlayback() {
    const now = performance.now();
    const time = player.getCurrentTime();
    if (lastTime !== undefined) {
      const elapsed = (now - lastSample) / 1000;
      const advanced = time - lastTime;
      if (lastTime <= furthest + 0.5 && advanced > 0 && advanced <= elapsed * player.getPlaybackRate() + 0.35) {
        furthest = Math.max(furthest, time);
      }
    }
    lastTime = time;
    lastSample = now;
  }
  function failed() {
    if (!disposed) onError();
  }
  loadPublicTrainingYouTube().then(YT => {
    if (disposed) return;
    const frame = document.createElement('iframe');
    const url = new URL('https://www.youtube.com/embed/' + videoId);
    url.search = new URLSearchParams({ enablejsapi: '1', playsinline: '1', rel: '0', origin: location.origin });
    frame.src = url.href;
    frame.title = '財政部臺北國稅局公開補課影片';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:16/9;min-height:200px;border:0';
    container.append(frame);
    readyTimer = setTimeout(failed, 8000);
    player = new YT.Player(frame, {
      events: {
        onReady: () => {
          clearTimeout(readyTimer);
          if (disposed) return;
          onReady();
          let ended = false;
          interval = setInterval(() => {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING && !document.hidden) trackPlayback();
            else if (state === YT.PlayerState.ENDED && !ended) {
              trackPlayback();
              const duration = player.getDuration();
              if (duration > 0 && furthest >= duration - 0.8) onComplete();
              else onIncomplete();
            } else lastTime = undefined;
            ended = state === YT.PlayerState.ENDED;
          }, 200);
        },
        onError: failed
      }
    });
  }).catch(failed);
  return {
    pause() { player?.pauseVideo?.(); },
    destroy() {
      disposed = true;
      clearInterval(interval);
      clearTimeout(readyTimer);
      player?.destroy?.();
    }
  };
}
