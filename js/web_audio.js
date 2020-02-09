var scene_rot = false;
var target = document.documentElement;
var body = document.body;
var file_input = document.querySelector('input');

//WebAudio

var context = new (window.AudioContext || window.webkitAudioContext)();
var analyser = context.createAnalyser();
var sound_data_array;

const MAX_SOUND_VALUE = 2;//The number of segments
const samples = 120;
const segment_brightness = 50;

//THREE JS

var rev_time = 0.01;
var sphere;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 60;
camera.lookAt(0, 0, 0);
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
//Meshes array
//Globally accessible arrays.
var segment_geometry_array = [];
//Perhaps could be stored together in an object.
var segment_material_array = [];
var segments_array = [];



create_skybox();
set_up_all_arrays();
animate();





//Window resize
window.addEventListener('resize', handle_resize, false);

//Drag & drop

target.addEventListener('dragover', (e) => {
    e.preventDefault();
    body.classList.add('dragging');
});

target.addEventListener('dragleave', () => {
    body.classList.remove('dragging');
});

target.addEventListener('drop', (e) => {
    e.preventDefault();
    body.classList.remove('dragging');

    file_input.files = e.dataTransfer.files;
    file_play();
});

function handle_resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//Load selected file & start play
function file_play() {
    //What element we want to play the audio.
    var sound_to_play = document.getElementById("sound");
    //How we load the file.
    var reader = new FileReader();
    //What we do when we load a file.                   
    reader.onload = function (e) {
        //Setting the source for the sound element.                    
        sound_to_play.src = this.result;
        //User can pause and play audio.                       
        sound_to_play.controls = true;
        //Start playing the tunes!
        sound_to_play.play();
    };
    //This will call the reader.onload function when it finishes loading the file.
    reader.readAsDataURL(audio_input.files[0]);
    create_audio_objects();
};





//WebAudio functions

//Creating context and analyzer for further interactions
//Connects the audio source to the analyser and creating a suitably sized array to hold the frequency data.
function create_audio_objects() {
    source = context.createMediaElementSource(document.getElementById("sound"));
    source.connect(analyser);
    analyser.connect(context.destination);
    //128, 256, 512, 1024 and 2048 are valid values.
    analyser.fftSize = 1024;
    sound_data_array = new Uint8Array(analyser.frequencyBinCount);
}

//Audio samples
//Returns the average of a small sample of the array. Index declares which sample you want from a no_sample_sections, ideal for iteration.
function get_sample_of_sound_data(index, no_sample_sections, sound_data_array) {
    var sample_size = Math.floor((sound_data_array.length / 2) / no_sample_sections);

    var min_bound = index * sample_size;
    var max_bound = (index + 1) * sample_size;
    var sum = 0;

    for (var i = min_bound; i < max_bound; i++) {
        sum += sound_data_array[i];
    }
    var average = sum / sample_size;

    return average / MAX_SOUND_VALUE;
}





//Three JS functions

function create_skybox() {
    //Creating the sphere geometry.
    var sphere_box = new THREE.SphereGeometry(110, 32, 32);

    var sphere_texture = new THREE.TextureLoader().load('2k_stars.jpg');

    //Creating a material for the sphere.
    var sphere_material = new THREE.MeshBasicMaterial({ map: sphere_texture, side: THREE.BackSide });

    //Combining geometry and material.  
    sphere = new THREE.Mesh(sphere_box, sphere_material);

    //Add the result to the scene.
    scene.add(sphere);
}

function set_up_all_arrays() {
    for (var i = 0; i < samples; i++) {

        segment_geometry_array.push(new THREE.BoxGeometry(0.5, 0.25, 0.5));

        segment_material_array.push(new THREE.MeshBasicMaterial({
            color: new THREE.Color("hsl(" + (i * 359) / samples + ", 100%, " + String(Math.floor(segment_brightness)) + "%)"),
            side: 2
        }));

        segments_array.push(new THREE.Mesh(segment_geometry_array[i], segment_material_array[i]));

        //Each box in its own position
        segments_array[i].position.set(i - samples / 2, 0, 0);

        //Add the segment to the scene.
        scene.add(segments_array[i]);
    }
}

function update_meshes() {
    for (var i = 0; i < samples; i++) {

        //Fallback value if sound_data_array doesn't exist.
        var sample_level = 0;
        if ((sound_data_array === undefined) == false) {
            sample_level = get_sample_of_sound_data(i, samples, sound_data_array);
        }

        //Scale the mesh on x,y,z planes. Input matters only for z plane
        segments_array[i].scale.set(1, 1, 1 + sample_level);
    }
}

function animate() {
    requestAnimationFrame(animate);

    scene_rot = !(document.getElementById("sound").paused);

    if (scene_rot == true) {
        document.getElementById("filename").innerHTML = "Teraz odtwarzane: <br>" + document.getElementById("audio_input").files[0].name;

        sphere.rotation.x += rev_time;
        sphere.rotation.z += rev_time;

        camera.lookAt(scene.position);
    }
    else if (document.getElementById("audio_input").files[0].name != null) {
        document.getElementById("filename").innerHTML = "Odtwarzanie wstrzymane. <br> Przeciągnij plik na ekran lub wciśnij play aby odtworzyć.";
    }

    //Update the sound_data_array with the new sound data.
    if ((sound_data_array === undefined) == false) {
        analyser.getByteFrequencyData(sound_data_array);
    }

    //Updates the mesh array.            
    update_meshes();
    //Render a new frame of the scene.              
    renderer.render(scene, camera);
}