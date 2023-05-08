import {
  HandLandmarker,
  FilesetResolver,
} from "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.1.0-alpha-11";
const classesNames = [
  "ع",
  "ال",
  "ا",
  "ب",
  "د",
  "ظ",
  "ض",
  "ف",
  "ق",
  "غ",
  "ه",
  "ح",
  "ج",
  "ك",
  "خ",
  "لا",
  "ل",
  "م",
  "nothing",
  "ن",
  "ر",
  "ص",
  "س",
  "ش",
  "ت",
  "ط",
  "ث",
  "ذ",
  "ة",
  "و",
  "ي",
  "ئ",
  "ز",
];
let videos=[];
// let word=""
let Camletter = [];
let counter = 0;

let videosParent=[];
let enableprediction=false;
let handLandmarker;
let handModel;
const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.1.0-alpha-11/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task`,
    },
    runningMode: 'VIDEO',
    numHands: 2,  
  });
  handModel = await tf.loadLayersModel(
    "https://raw.githubusercontent.com/Mustafa-Esmaail/arabic-sign-language/sign-lang-model-v1/model.json"
  );
 

 
};
createHandLandmarker();

const calc_landmark_list=(landmarks,videoHeight,videoWidth)=>{
  let landmark_point = [];

  landmarks.map((landmark) => {

    const landmark_x = Math.min(
      Number(landmark.x * videoWidth),
      videoWidth - 1
    );
    const landmark_y = Math.min(
      Number(landmark.y * videoHeight),
      videoHeight - 1
    );
    landmark_point.push([landmark_x, landmark_y]);
  });
  return landmark_point;

}  
const process_landmark_ponts=(landmark_points)=>{
  var base_x = 0;
  var base_y = 0;
  let marks = [];

  landmark_points.map((point, index) => {
    if (index === 0) {
      base_x = landmark_points[index][0];

      base_y = landmark_points[index][1];
    }
    landmark_points[index][0] = landmark_points[index][0] - base_x;
    landmark_points[index][1] = landmark_points[index][1] - base_y;
    marks.push(landmark_points[index][0]);
    marks.push(landmark_points[index][1]);
  });

  let max_value = Math.max.apply(null, marks.map(Math.abs));

  marks.map((point, idx) => {
    marks[idx] = marks[idx] / max_value;
  });
  let tfMark = tf.tensor(marks).reshape([1, 42]);


  return tfMark;

}
const predict =async ()=>{
  // enableprediction=true
  // console.log(videos)
  for(let i =0;i< videos.length;i++){

      const videoWidth =videos[i].videoWidth;
      const videoHeight =videos[i].videoHeight;
      console.log(videoWidth);
      console.log(videos[i])
      let startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(videos[i], startTimeMs);
      console.log(results)
      const canvas=  videosParent[i].childNodes[1];
      const h4result=  videosParent[i].childNodes[2];
      const cxt = canvas.getContext("2d");
      let word ="";
      let letter=''
      console.log(results.landmarks)
      if(results.landmarks.length >0){
      counter = 0;
        results.landmarks.map((landmarks) => {
          let landmark_list= calc_landmark_list(landmarks,videoHeight,videoWidth);
          console.log(landmark_list);
          let tfLand= process_landmark_ponts(landmark_list);
          console.log(tfLand)
          const prediction = handModel.predict(tfLand);
          const handResult = prediction.dataSync();
          const arr = Array.from(handResult);
          const maxPredict = Math.max.apply(null, arr);
          const idx = arr.indexOf(maxPredict);
          console.log(classesNames[idx]);
          word= word.concat(classesNames[idx])
          console.log(word)
          Camletter[i].push(classesNames[idx]);
          word = Camletter[i].join("");
          h4result.innerHTML=word
          // Camletter.push(classesNames[idx]);
          
 

        });
 
      }
      else{
        counter++;
        if(counter ===3 ){
          Camletter[i].push(' ')
          counter=0;
        }
      }
      cxt.save();
      cxt.clearRect(0, 0, canvas.width, canvas.height);
      for (const landmarks of results.landmarks) {
          drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5,
          });
          drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
      }
    cxt.restore();
      cxt.restore();

     

  }
 


  setTimeout(() => {
      if(enableprediction==true){
          predict();
          console.log(counter)

      }
    }, 700);
  // let startTimeMs = performance.now();
  // const results = handLandmarker.detectForVideo(video, startTimeMs);
  // console.log(results)

}



const APP_ID = "7431e3d68f8840a5a64e518def368477"
const TOKEN = "007eJxTYPhm2/OjRdvKbvXSnTOl1xl7B3d9b+j4+/Ne+HRlQWnLz1wKDOYmxoapxilmFmkWFiYGiaaJZiappoYWKalpxmYWJubm296EpzQEMjL8venIzMjAyMACxCA+E5hkBpMsYJKdIbe0uCQxLZGBAQA3cCQN"
const CHANNEL = "mustafa"
let userID='';
const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})

let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {

  client.on('user-published', handleUserJoined)
  
  client.on('user-left', handleUserLeft)
  
  let UID = await client.join(APP_ID, CHANNEL, TOKEN, null)
  userID=UID

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks() 

  let player = `<div class="video-container" id="user-container-${UID}">
                      <div class="video-player" id="user-${UID}"></div>
                </div>`
  document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

  localTracks[1].play(`user-${UID}`)
  
  await client.publish([localTracks[0], localTracks[1]])
}

let joinStream = async () => {
  await joinAndDisplayLocalStream()
  document.getElementById('join-btn').style.display = 'none'
  document.getElementById('stream-controls').style.display = 'flex'
  videos=document.getElementsByClassName('agora_video_player')
  videosParent=document.getElementsByClassName('video-parent')
   for(let i =0;i<=videosParent.length;i++){
      const canvas = document.createElement("canvas");
      const h4 = document.createElement("h4");
      h4.setAttribute("class", "cam-result");
      canvas.setAttribute("class", "canvas");
      canvas.setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
      canvas.setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
      canvas.style =
          "left: 0px;" +
          "top: 0px;" +
          "width: " +
          videosParent[i].getBoundingClientRect().width +
          "px;" +
          "height: " +
          videosParent[i].getBoundingClientRect().height +
          "px;";
          videosParent[i].appendChild(canvas);
          videosParent[i].appendChild(h4);
          // console.log(videosParent[i].getBoundingClientRect().height)
   }
  // console.log(video)
}

let handleUserJoined = async (user, mediaType) => {

  remoteUsers[user.uid] = user 
  await client.subscribe(user, mediaType)

  if (mediaType === 'video'){
      let player = document.getElementById(`user-container-${user.uid}`)
      if (player != null){
          player.remove()
      }

      player = `<div class="video-container" id="user-container-${user.uid}">
                      <div class="video-player" id="user-${user.uid}"></div> 
               </div>`
      document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)

      user.videoTrack.play(`user-${user.uid}`)
  }

  if (mediaType === 'audio'){
      user.audioTrack.play()
  }
  Camletter.push([])
  console.log(Camletter)
  let videosParentlast=document.querySelectorAll(".video-parent")
  for(let i =0;i<=videosParentlast.length;i++){
  
      if (videosParentlast[i].childNodes.length > 1) { // Or just `if (element.childNodes.length)`
          // It has at least one
          console.log(videosParentlast[i].childNodes[1])
          videosParentlast[i].childNodes[1].style="width: " +
          videosParent[i].getBoundingClientRect().width +
          "px;" +
          "height: " +
          videosParent[i].getBoundingClientRect().height +
          "px;";
          videosParentlast[i].childNodes[1].setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
          videosParentlast[i].childNodes[1].setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
      }
      else{
          const canvas = document.createElement("canvas");
          const h4 = document.createElement("h4");
          h4.setAttribute("class", "cam-result");
          canvas.setAttribute("class", "canvas");
          canvas.setAttribute("width", videosParent[i].getBoundingClientRect().width + "px");
          canvas.setAttribute("height", videosParent[i].getBoundingClientRect().height + "px");
          canvas.style =
              "left: 0px;" +
              "top: 0px;" +
              "width: " +
              videosParent[i].getBoundingClientRect().width +
              "px;" +
              "height: " +
              videosParent[i].getBoundingClientRect().height +
              "px;";
              videosParent[i].appendChild(canvas);
              videosParent[i].appendChild(h4);

                      // console.log(videosParent[i].getBoundingClientRect().height)
      }
     
   }

}

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid]
  document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
  for(let i = 0; localTracks.length > i; i++){
      localTracks[i].stop()
      localTracks[i].close()
  }

  await client.leave()
  document.getElementById('join-btn').style.display = 'block'
  document.getElementById('stream-controls').style.display = 'none'
  document.getElementById('video-streams').innerHTML = ''
}

let toggleMic = async (e) => {
  if (localTracks[0].muted){
      await localTracks[0].setMuted(false)
      e.target.innerText = 'Mic on'
      e.target.style.backgroundColor = 'cadetblue'
  }else{
      await localTracks[0].setMuted(true)
      e.target.innerText = 'Mic off'
      e.target.style.backgroundColor = '#EE4B2B'
  }
}

let toggleCamera = async (e) => {
  console.log(userID)
  if(localTracks[1].muted){
      await localTracks[1].setMuted(false)
      e.target.innerText = 'Camera on'
      e.target.style.backgroundColor = 'cadetblue'
  }else{
      await localTracks[1].setMuted(true)
      e.target.innerText = 'Camera off'
      e.target.style.backgroundColor = '#EE4B2B'
  }
}
let togglePredict= async (e) => {
  
  if(enableprediction==true){
      let h4Results=document.getElementsByClassName('cam-result')
      console.log(h4Results)
      for(let i=0;i < h4Results.length ; i++){
        console.log(h4Results[i])
      h4Results[i].innerHTML=""
      }
      word=""
      enableprediction=false;
      e.target.innerText = 'Start Detection'

  }else{
      enableprediction=true
      predict()
      e.target.innerText = 'Stop Detection'
      // // e.target.style.backgroundColor = '#EE4B2B'
  }
  console.log(enableprediction)
}

document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveAndRemoveLocalStream)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
// document.getElementById('detect-start').addEventListener('click', predict)
document.getElementById('detect-stop').addEventListener('click', togglePredict)
