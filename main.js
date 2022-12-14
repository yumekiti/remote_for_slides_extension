const host = 'https://remote.yumekiti.net';

// function
const setUUID = async () => {
  const res = await axios.get(host + '/uuid');
  chrome.storage.sync.set({ uuid: res.data.uuid });
};

const getUUID = async () => {
  const uuid = await chrome.storage.sync.get('uuid');
  return uuid.uuid;
};

const socket = io.connect(host);
socket.on('connect', () => {
  console.log('socket connected');
});

socket.on('event', (value) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    const title = tabs[0].title;

    if(!url && !title) return;

    if(url.match(/figma/i)){
      if (value === 'next') {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            document.querySelector('[aria-label="Next frame"]').click();
          },
        });
      }
      if (value === 'prev') {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            document.querySelector('[aria-label="Previous frame"]').click();
          },
        });
      }
    }

    if(title.match(/slidev/i) || url.match(/slidev/i)){
      if (value === 'next') {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            document
              .querySelector("#slide-container > div.absolute.bottom-0.left-0.transition.duration-300.opacity-0.hover\\:opacity-100.opacity-0.p-2 > nav > div > button:nth-child(3)")
              .click();
          },
        });
      }
      if (value === 'prev') {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            document
              .querySelector("#slide-container > div.absolute.bottom-0.left-0.transition.duration-300.opacity-0.hover\\:opacity-100.opacity-0.p-2 > nav > div > button:nth-child(2)")
              .click();
          },
        });
      }
    }
  });
});

const createButtonElement = document.getElementById('createButton');

const start = async () => {
  await setUUID();
  const uuid = await getUUID();
  const link = host + '/room/' + uuid;

  const qrcodeElement = document.getElementById('qrcode');
  qrcodeElement.innerHTML = '';
  new QRCode(qrcodeElement, {
    text: link,
    width: 128 * 2,
    height: 128 * 2,
    colorDark: '#ffffff',
    colorLight: '#333333',
    correctLevel: QRCode.CorrectLevel.H,
  });

  const shareWrapElement = document.getElementById('shareWrap');
  shareWrapElement.classList.remove('hidden');

  // add input
  const urlElement = document.getElementById('urlInputTag');
  urlElement.value = link;

  const copyButtonElement = document.getElementById('copyButton');
  copyButtonElement.addEventListener('click', () => {
    urlElement.select();
    urlElement.setSelectionRange(0, 99999);
    document.execCommand('copy');
  });

  createButtonElement.textContent = 'Room Re:Create';

  await socket.emit('join', uuid);
};

createButtonElement.addEventListener('click', async () => await start());
