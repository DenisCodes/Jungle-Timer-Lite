console.log('renderer script');
console.log('[renderer] window.osr =', window.osr);
console.log(
  '[renderer] typeof setMinimapScale =',
  typeof window.osr?.setMinimapScale
);


//@ts-ignore
window.gep.onMessage(function(...args) {
  console.info(...args);

  let item = ''
  args.forEach(arg => {
    item = `${item}-${JSON.stringify(arg)}`;
  })
  addMessageToTerminal(item);

});


const applyMinimapScaleBtn = document.querySelector('#applyMinimapScale') as HTMLButtonElement;
applyMinimapScaleBtn.addEventListener('click', async () => {
  try {
    const scaleInput = document.querySelector('#minimapScaleInput') as HTMLInputElement;
    const scale = parseFloat(scaleInput.value);
    console.log('setting minimap scale to', scale);
    await window.osr.setMinimapScale(scale);
    addMessageToTerminal(`Minimap scale set to ${scale}`);
  } catch (error) {
    console.error('setMinimapScale error', error);
    addMessageToTerminal(`Error setting minimap scale: ${error}`);
    alert(`Error setting minimap scale: ${error}`);
  }
});

const applyMinimapSideBtn = document.querySelector('#applyMinimapSide') as HTMLButtonElement;
applyMinimapSideBtn.addEventListener('click', async () => {
  try {
    const sideInput = document.querySelector('input[name="minimapSide"]:checked') as HTMLInputElement;
    const side = parseInt(sideInput.value, 10) as 0 | 1;
    console.log('setting minimap side to', side === 1 ? 'left' : 'right');
    await window.osr.setMinimapSide(side);
    addMessageToTerminal(`Minimap side set to ${side === 1 ? 'Left' : 'Right'}`);
  } catch (error) {
    console.error('setMinimapSide error', error);
    addMessageToTerminal(`Error setting minimap side: ${error}`);
    alert(`Error setting minimap side: ${error}`);
  }
});

const btn = document.querySelector('#clearTerminalTextAreaBtn') as HTMLButtonElement;

btn.addEventListener('click', function(e) {
  var begin = new Date().getTime();
  const terminal = document.querySelector('#TerminalTextArea');
  terminal.innerHTML = '';
});

const setRequiredBtn = document.querySelector('#setRequiredFeaturesBtn') as HTMLButtonElement;
setRequiredBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    await window.gep.setRequiredFeature();
    addMessageToTerminal('setRequiredFeatures ok');
  } catch (error) {
    addMessageToTerminal('setRequiredFeatures error');
    alert('setRequiredFeatures error' + error);
  }
});

const getInfoBtn = document.querySelector('#getInfoBtn') as HTMLButtonElement;
getInfoBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.gep.getInfo();
    addMessageToTerminal(JSON.stringify(info));
  } catch (error) {
    addMessageToTerminal('getInfo error');
    alert('getInfo error' + error);
  }
});

const createOSRBtn = document.querySelector('#createOSR') as HTMLButtonElement;
createOSRBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.openOSR();
  } catch (error) {
    addMessageToTerminal('createOSR error');
  }
});

const visibilityOSRBtn = document.querySelector('#visibilityOSR') as HTMLButtonElement;
visibilityOSRBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.toggle();
  } catch (error) {
    console.log(error);
    addMessageToTerminal('toggle osr error');
  }
});


const updateHotkeyBtn = document.querySelector('#updateHotkey') as HTMLButtonElement;
updateHotkeyBtn.addEventListener('click', async function(e) {
  try {
    // @ts-ignore
    const info = await window.osr.updateHotkey();
  } catch (error) {
    console.log(error);
    addMessageToTerminal('toggle osr error');
  }
});


function addMessageToTerminal(message) {
  const terminal = document.querySelector('#TerminalTextArea');
  // $('#TerminalTextArea');
  terminal.append(message + '\n');
  terminal.scrollTop = terminal.scrollHeight;
}

export function sendExclusiveOptions() {
  const color = (document.getElementById('colorPicker') as HTMLInputElement).value;

  const r = parseInt(color.substr(1,2), 16);
  const g = parseInt(color.substr(3,2), 16);
  const b = parseInt(color.substr(5,2), 16);
  const a = (document.getElementById('opacityRange') as HTMLInputElement).value;

  const options = {
     color: `rgba(${r},${g},${b},${a})`,
     animationDuration:
      parseInt((document.getElementById('animationDurationRange') as HTMLInputElement).value)
  };

  // @ts-ignore
  window.overlay.updateExclusiveOptions(options);
}



const opacityRange = document.getElementById('opacityRange') as HTMLInputElement;
opacityRange.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})

const animationDurationRange = document.getElementById('animationDurationRange') as HTMLInputElement;
animationDurationRange.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})

const colorPicker = document.getElementById('colorPicker') as HTMLInputElement;
colorPicker.addEventListener('change', (ev) => {
  sendExclusiveOptions();
})


document.querySelectorAll('[name="behavior"]').forEach(
  (radio)=>{radio.addEventListener('change',(a)=>{
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeHotkeyBehavior(radio.value);
    }
  })
})

document.querySelectorAll('[name="exclusiveType"]').forEach(
  (radio)=>{radio.addEventListener('change',(a)=>{
    const radio = a.target as HTMLInputElement;
    if (radio.checked) {
      // @ts-ignore
      window.overlay.setExclusiveModeType(radio.value);
    }
  })
})
