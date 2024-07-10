// getting Elements from Dom 
const joinButton = document.querySelector("button");
const audioContainer = document.getElementById("audioContainer");
const textDiv = document.getElementById("textDiv");

// declare Variables
let participants = [];
let meeting = null;
let localParticipantAudio;
let remoteParticipantId = "";

joinButton.addEventListener("click", () => {
  joinButton.style.display = "none";
  textDiv.textContent = "Please wait, we are joining the meeting";

  window.VideoSDK.config("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI4OTUyM2M3Ni1iZmYzLTRlNDgtYTQ2MS0yYmUyN2Y3ZWUyMTEiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTcyMDYzMDc4NiwiZXhwIjoxNzIwNzE3MTg2fQ.5VOyHUEl7oYmG82fnf2Y_KIsWtxpq59Vx-MhsWNmnNk"); // required
  meeting = window.VideoSDK.initMeeting({
    meetingId: "3n48-l9wm-6n2t", // required
    name: "Mister's Org", // required
    micEnabled: true, // optional, default: true
    webcamEnabled: false, // optional, default: true
  });

  meeting.join();
});

function createAudioElement(pId) {
  let audioElement = document.createElement("audio");
  audioElement.setAttribute("autoPlay", "false");
  audioElement.setAttribute("playsInline", "true");
  audioElement.setAttribute("controls", "false");
  audioElement.setAttribute("id", `a-${pId}`);
  return audioElement;
}

function setTrack(stream, audioElement, participant, isLocal) {
  if (stream.kind == "audio" && !isLocal) {
    const mediaStream = new MediaStream();
    mediaStream.addTrack(stream.track);
    audioElement.srcObject = mediaStream;
    audioElement
      .play()
      .catch((error) => console.error("audioElem.play() failed", error));
  }
}

joinButton.addEventListener("click", () => {
  // creating local participant audio
  localParticipantAudio = createAudioElement(meeting.localParticipant.id);
  audioContainer.appendChild(localParticipantAudio);

  // setting local participant stream
  meeting.localParticipant.on("stream-enabled", (stream) => {
    setTrack(
      stream,
      localParticipantAudio,
      meeting.localParticipant,
      (isLocal = true)
    );
  });

  meeting.on("meeting-joined", () => {
    textDiv.style.display = "none";
  });

  // other participants
  meeting.on("participant-joined", (participant) => {
    let audioElement = createAudioElement(participant.id);
    remoteParticipantId = participant.id;

    participant.on("stream-enabled", (stream) => {
      setTrack(stream, audioElement, participant, (isLocal = false));
    });
    audioContainer.appendChild(audioElement);
  });

  // participants left
  meeting.on("participant-left", (participant) => {
    let aElement = document.getElementById(`a-${participant.id}`);
    aElement.parentNode.removeChild(aElement);
  });
});
