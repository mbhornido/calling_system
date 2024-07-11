// Getting Elements from DOM
const joinButton = document.getElementById("joinBtn");
const createButton = document.getElementById("createMeetingBtn");
const textDiv = document.getElementById("textDiv");

let meeting = null;
let meetingId = "";

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
    document.getElementById("meetingIdHeading").textContent = `Meeting Id: ${meetingId}`;
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
}
