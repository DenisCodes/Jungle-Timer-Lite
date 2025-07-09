export {}; // This makes this file a "module" so TypeScript allows declare global

// Listen for jungle camp spawn events from main process
window.osr.onJungleCampSpawn((jungleCampData) => {
  console.log('🔥 osr camp data:', jungleCampData);
  try {
    const parsedValue = JSON.parse(jungleCampData.value); // value is a stringified JSON
    const campName = parsedValue.name.trim();
    const isAlive = parsedValue.alive;
    const iconStatus = parsedValue.icon_status;

    console.log(`🔍 Camp: ${campName} | Alive: ${isAlive} | Status: ${iconStatus}`);

    const campElement = document.getElementById(campName);
    if (!campElement) {
      console.warn(`⚠️ No matching element for camp name: "${campName}"`);
      return;
    }

    // Clear timer if camp is alive
    if (isAlive) {
      clearInterval((campElement as any).timerInterval);
      campElement.innerText = '';
      console.log(`🛑 Timer cleared for ${campName} (alive)`);
      return;
    }

    // Decide duration based on icon_status
    let duration = 135; // default

    switch (iconStatus) {
      case '0':
        duration = 135;
        break;
      case '1':
        duration = 30;
        break;
      case '2':
        duration = 10;
        break;
      default:
        console.warn(`⚠️ Unknown icon_status "${iconStatus}", using default 135 seconds`);
    }

    startTimer(campElement, duration);

  } catch (error) {
    console.error('❌ Failed to parse jungle camp spawn data:', error);
  }
});

/**
 * Starts a countdown timer inside the given element.
 * @param element The DOM element to update.
 * @param seconds Time in seconds for countdown.
 */
function startTimer(element: HTMLElement, seconds: number) {
  console.log('⏱️ Starting timer:', seconds, 'seconds');
  clearInterval((element as any).timerInterval); // Clear any existing timer

  let remaining = seconds;
  updateElementTimer(element, remaining);

  (element as any).timerInterval = setInterval(() => {
    remaining--;

    if (remaining <= 0) {
      clearInterval((element as any).timerInterval);
      element.innerText = 'Respawned!';
    } else {
      updateElementTimer(element, remaining);
    }
  }, 1000);
}

/**
 * Updates the text content of the element with formatted timer.
 * @param element The DOM element to update.
 * @param secondsRemaining Remaining seconds.
 */
function updateElementTimer(element: HTMLElement, secondsRemaining: number) {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  element.innerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
