// Getting Elements from DOM
const joinButton = document.getElementById("joinBtn");
const createButton = document.getElementById("createMeetingBtn");
const textDiv = document.getElementById("textDiv");
const toggleMicButton = document.getElementById("toggleMicBtn");
const stopRecordingButton = document.getElementById("stopRecordingBtn");

let meeting = null;
let meetingId = "";
let isMicOn = true;

function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  return audioElement;
}

function createImageElement(pId) {
  let imgElement = document.createElement("img");
  imgElement.setAttribute("src", "img1.png");
  imgElement.classList.add("participant-img");
  imgElement.setAttribute("id", `img-${pId}`);
  return imgElement;
}

function createLocalParticipant() {
  const localParticipantId = meeting.localParticipant.id;
  let imgElement = createImageElement(localParticipantId);
  textDiv.appendChild(imgElement);
}

function setTrack(stream, audioElement, participant, isLocal) {
  if (stream.kind == "audio" && !isLocal) {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    audioElement.srcObject = mediaStream;
    audioElement.play().catch((error) =>
      console.error("audioElem.play() failed", error)
    );
  }
}

// Copy to clipboard function
function copyToClipboard(text) {
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
}

// Join Meeting Button Event Listener
joinButton.addEventListener("click", async () => {
  document.getElementById("join-screen").style.display = "none";
  textDiv.textContent = "Joining the meeting...";

  meetingId = document.getElementById("meetingIdTxt").value;
  initializeMeeting();
});

// Create Meeting Button Event Listener
createButton.addEventListener("click", async () => {
  document.getElementById("join-screen").style.display = "none";
  textDiv.textContent = "Please wait, we are joining the meeting";

  const url = `https://api.videosdk.live/v2/rooms`;
  const options = {
    method: "POST",
    headers: { Authorization: TOKEN, "Content-Type": "application/json" },
  };

  const response = await fetch(url, options);
  const data = await response.json();
  meetingId = data.roomId;

  initializeMeeting();
});

function initializeMeeting() {
  window.VideoSDK.config(TOKEN);

  meeting = window.VideoSDK.initMeeting({
    meetingId: meetingId,
    name: "Thomas Edison",
    micEnabled: true,
    webcamEnabled: false, // Set to false to disable video
  });

  meeting.join();

  createLocalParticipant();

  meeting.localParticipant.on("stream-enabled", (stream) => {
    setTrack(stream, null, meeting.localParticipant, true);
  });

  meeting.on("meeting-joined", () => {
    textDiv.style.display = "none";
    document.getElementById("grid-screen").style.display = "block";
    const meetingUrl = `${window.location.origin}?meetingId=${meetingId}`;
    const meetingIdHeading = document.getElementById("meetingIdHeading");
    meetingIdHeading.innerHTML = `Meeting Id: <span id="meetingIdSpan">${meetingId}</span>`;
    
    const meetingIdSpan = document.getElementById("meetingIdSpan");
    meetingIdSpan.addEventListener("click", () => {
      copyToClipboard(meetingUrl);
      alert("Meeting URL copied to clipboard!");
    });

    startRecording(); // Start recording when the meeting is joined
  });

  meeting.on("participant-joined", (participant) => {
    let audioElement = createAudioElement(participant.id);
    let imgElement = createImageElement(participant.id);

    participant.on("stream-enabled", (stream) => {
      setTrack(stream, audioElement, participant, false);
    });

    textDiv.appendChild(audioElement);
    textDiv.appendChild(imgElement);
  });

  meeting.on("participant-left", (participant) => {
    document.getElementById(`a-${participant.id}`).remove();
    document.getElementById(`img-${participant.id}`).remove();
  });

  meeting.on("recording-state-changed", (data) => {
    const { status } = data;
    if (status === window.VideoSDK.Constants.recordingEvents.RECORDING_STARTING) {
      console.log("Meeting recording is starting");
    } else if (status === window.VideoSDK.Constants.recordingEvents.RECORDING_STARTED) {
      console.log("Meeting recording is started");
    } else if (status === window.VideoSDK.Constants.recordingEvents.RECORDING_STOPPING) {
      console.log("Meeting recording is stopping");
    } else if (status === window.VideoSDK.Constants.recordingEvents.RECORDING_STOPPED) {
      console.log("Meeting recording is stopped");
    }
  });
}

// Toggle Mic Button Event Listener
toggleMicButton.addEventListener("click", async () => {
  if (isMicOn) {
    // Disable Mic in Meeting
    meeting?.muteMic();
    toggleMicButton.textContent = "Unmute Mic";
  } else {
    // Enable Mic in Meeting
    meeting?.unmuteMic();
    toggleMicButton.textContent = "Mute Mic";
  }
  isMicOn = !isMicOn;
});

// Start Recording Function
function startRecording() {
  const config = {
    layout: {
      type: "GRID",
      priority: "SPEAKER",
      gridSize: 4,
    },
    theme: "DARK",
    mode: "audio",
    quality: "high",
    orientation: "landscape",
  };

  const transcription = {
    enabled: true,
    summary: {
      enabled: true,
      prompt: "Write summary in sections like Title, Agenda, Speakers, Action Items, Outlines, Notes and Summary",
    },
  };

  meeting?.startRecording(
    "YOUR WEB HOOK URL",
    "AWS Directory Path",
    config,
    transcription
  );
}

// Stop Recording Button Event Listener
stopRecordingButton.addEventListener("click", () => {
  meeting?.stopRecording();
});

// Handle URL meetingId
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingIdFromUrl = urlParams.get('meetingId');
  if (meetingIdFromUrl) {
    document.getElementById("join-screen").style.display = "none";
    textDiv.textContent = "Joining the meeting...";
    meetingId = meetingIdFromUrl;
    initializeMeeting();
  }
});
