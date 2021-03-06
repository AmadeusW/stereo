var positionBase = [0, 0, -9]; // Base position of images
var eyeDelta = [0, 0, 0]; // Per-eye offset for each image
var eyeDeltaStep = 1;
var positionHead = [0, 0, 0]; // raw value for head's position
var positionOrigin = [0, 0, 0]; // origin head position
var positionOffset = [0, 0, 0]; // Both-eye offset controlled by user's head position
var rotationHead = [0, 0, 0]; // raw value for head's rotation
var rotationOrigin = [0, 0, 0]; // origin head rotation
var rotationOffset = [0, 0, 0]; // Both-eye offset controlled by user's head rotation
var positionOffsetFactor = [0, 0, 0]; // how user's head position translates into image offset
var rotationOffsetFactor = [4, -4, 0]; // how user's head rotation translates into image offset
var loadedImageId = -1;
var currentImageId = 0;
var currentThumbL = 0;
var currentThumbR = 0;
var lastImage = 0;
var timeoutId;
var allCategories = [];
var imagePathPrefix = "";
var isMenuVisible = false;
var cdnPrefix = "https://vrcv.azureedge.net/vrcv/";
//var mainTitleVue;
//var galleryTitleVue;
//var mainMenuVue;
//var galleryMenuVue;
var allItems;
var directDisplay = true;

//initialize();

async function initialize() {
    console.log("init");
    var categories = initializeMenu();
    allCategories = await categories;
    //buildMenu(await categories);
    //showMainUI();
    initializeAFrame();
    await goToCategory(0, 0); // Initial category to display
    scenes = await initializeCategory((await categories)[0].Feed)
    render();
}

function getViewModel(scene, index) {
    return {
        title: scene.Title,
        imageLeftUrl: cdnPrefix + imagePathPrefix + scene.Link + ".L.jpg",
        imageRightUrl: cdnPrefix + imagePathPrefix + scene.Link + ".R.jpg",
        thumbLeftUrl: cdnPrefix + imagePathPrefix + scene.Link+ ".T.L.jpg",
        thumbRightUrl: cdnPrefix + imagePathPrefix + scene.Link + ".T.R.jpg",
        originalUrl: scene.ShortLink, // user friendly link to the original
        originalImageUrl: scene.ImageUrl, // raw version of the image
        width: scene.W,
        height: scene.H,
        correction: scene.correction != null ? scene.correction : [0, 0, 0],
        id: index
    }
}

async function goToCategory(categoryId) {
    if (categoryId == null) throw "Invalid categoryId";
    scenes = await initializeCategory(allCategories[categoryId].Feed);
    console.log("goToCategory:", scenes);
    imagePathPrefix = allCategories[categoryId].ImagePathPrefix;
    allItems = scenes.map(getViewModel);
    //galleryMenuVue.items = scenes.map(getViewModel);
    //galleryTitleVue.galleryTitle = allCategories[categoryId].DisplayName;
    //galleryTitleVue.galleryDescription = allCategories[categoryId].Description;
    lastImage = scenes.length - 1;
    currentThumbR = 1;
    currentThumbL = lastImage;
    currentImageId = 0;
    loadedImageId = -1;
    console.log("Going to category " + categoryId + "; Loaded scenes: ", scenes, "; Prefix: ", imagePathPrefix);
    render();
}

function initializeAFrame() {
    const scene = document.querySelector('a-scene');
    if (scene.hasLoaded) {
        subscribeToEvents();
    } else {
        scene.addEventListener('loaded', subscribeToEvents);
        scene.addEventListener('exit-vr', onVrClosed);
    }
}

function render() {
    var vm = allItems[currentImageId];

    if (loadedImageId != currentImageId)
    {
        console.log("Rendering new image:", vm.title);
        loadedImageId = currentImageId;
        //galleryTitlneVue.item = vm;

        document.getElementById("leftPlane").setAttribute("width", Math.pow(2, vm.width))
        document.getElementById("leftPlane").setAttribute("height", Math.pow(2, vm.height))
        document.getElementById("rightPlane").setAttribute("width", Math.pow(2, vm.width))
        document.getElementById("rightPlane").setAttribute("height", Math.pow(2, vm.height))
        positionBase[2] = -Math.pow(1.88, vm.width); // this will update the distance

        document.getElementById("leftPlane").setAttribute("src", vm.imageLeftUrl)
        document.getElementById("rightPlane").setAttribute("src", vm.imageRightUrl)
        eyeDelta = vm.correction;
    }

    var positionR = (positionBase[0] + positionOffset[0] + rotationOffset[0] - vm.correction[0]/2)
        + " " + (positionBase[1] + positionOffset[1] + rotationOffset[1] - vm.correction[1]/2)
        + " " + (positionBase[2] + positionOffset[2] + rotationOffset[2] - vm.correction[2]/2);
    var positionL = (positionBase[0] + positionOffset[0] + rotationOffset[0] + vm.correction[0]/2)
        + " " + (positionBase[1] + positionOffset[1] + rotationOffset[1] + vm.correction[1]/2)
        + " " + (positionBase[2] + positionOffset[2] + rotationOffset[2] + vm.correction[2]/2);

    document.getElementById("leftPlane").setAttribute("position", positionL)
    document.getElementById("rightPlane").setAttribute("position", positionR)
}

function subscribeToEvents() {
    //setTimer();
    const p = document.querySelector("#camera");
    p.addEventListener('componentchanged', function (evt) {
        //console.log(evt.detail.name);
        /*if (usesParallax) {
            if (evt.detail.name === 'rotation') {
                rotationHead[0] = evt.detail.newData.y;
                rotationHead[1] = evt.detail.newData.x;
                rotationHead[2] = evt.detail.newData.z;
                positionOffset[0] = (rotationHead[0] - rotationOrigin[0]) * rotationOffsetFactor[0];
                positionOffset[1] = (rotationHead[1] - rotationOrigin[1]) * rotationOffsetFactor[1];
                positionOffset[2] = 0;
                render();
            }
        }*/
    });
}

function resetPosition() {
    positionOrigin[0] = positionHead[0];
    positionOrigin[1] = positionHead[1];
    positionOrigin[2] = positionHead[2];
    rotationOrigin[0] = rotationHead[0];
    rotationOrigin[1] = rotationHead[1];
    rotationOrigin[2] = rotationHead[2];
}

window.addEventListener("keydown", function(e){
    if(e.keyCode === 37) { // left
        eyeDelta[0] -= eyeDeltaStep;
        galleryTitleVue.item.correction = eyeDelta;
        render();
    }
    if(e.keyCode === 39) { // right
        eyeDelta[0] += eyeDeltaStep;
        galleryTitleVue.item.correction = eyeDelta;
        render();
    }
    if(e.keyCode === 38) { // up
        eyeDelta[1] += eyeDeltaStep;
        galleryTitleVue.item.correction = eyeDelta;
        render();
    }
    if(e.keyCode === 40) { // down
        eyeDelta[1] -= eyeDeltaStep;
        galleryTitleVue.item.correction = eyeDelta;
        render();
    }
    if(e.keyCode === 82) { // r
        resetPosition();
        render();
    }
    if(e.keyCode === 84) { // t
        toggleTimer();
    }
    if(e.keyCode === 67) { // c
        showCorrectionData();
    }
    if(e.keyCode === 78) { // n
        nextImage();
    }
    if(e.keyCode === 32) { // space
        nextImage();
    }
    if(e.keyCode === 80) { // p
        previousImage();
    }
    if(e.keyCode === 88) { // x
        toggleDisplayMode();
    }
    if(e.keyCode === 27) { // esc
        // disengages VR mode. don't use.
    }
});

function setTimer() {
    timeoutId = window.setTimeout(nextImageByTimer, 5000);
}

function nextImageByTimer() {
    nextImage();
    setTimer();
}

function nextImage() {
    saveImageCorrections();
    currentImageId = getNextIndex(currentImageId);

    var vm = allItems[currentImageId];
    preloadImage(vm.imageLeftUrl, vm.imageRightUrl);
    // render(); is called from onTempImageLoaded, as a result of preloadImage
}

function previousImage() {
    saveImageCorrections();
    currentImageId = getPreviousIndex(currentImageId);

    var vm = allItems[currentImageId];
    preloadImage(vm.imageLeftUrl, vm.imageRightUrl);
    // render(); is called from onTempImageLoaded, as a result of preloadImage
}

function saveImageCorrections() {
    allItems[currentImageId].correction = eyeDelta;
}

function showCorrectionData() {
    // Usage: copy this output into posts.json
    console.log(",")
    console.log("\"correction\": " + JSON.stringify(allItems[currentImageId].correction));
}

function getNextIndex(value) {
    return value < lastImage ? ++value : 0;
}

function getPreviousIndex(value) {
    return value > 0 ? --value : lastImage;
}

function toggleTimer() {
    if (timeoutId == null) {
        console.log("Enable timer");
        setTimer();
        document.getElementById("timerButton").setAttribute("color", "#cc3");
    } else {
        console.log("Disable timer");
        window.clearTimeout(timeoutId);
        timeoutId = null;
        document.getElementById("timerButton").setAttribute("color", "#311");
    }
}

function toggleDisplayMode() {
    directDisplay = !directDisplay;
    rebuildScene(directDisplay);
    render();
}

function rebuildScene(directDisplay) {
    if (directDisplay)
        document.getElementById("camera").appendChild(document.getElementById("mainPane"))
    else
        document.getElementById("scene").appendChild(document.getElementById("mainPane"))
}

AFRAME.registerComponent('x-controller-listener', {
    schema: {
        hand: {type: 'string', default: 'right'}
    },
    init: function () {
        var el = this.el;
        var flip = this.data.hand == 'left';
        console.log("Listening to the controller. Left hand? " + flip);
        el.addEventListener('triggerdown', function (evt) { // vive, oculus, gearvr
            console.log("Trigger", evt);
            if (flip) previousImage(); else nextImage();
        });
        el.addEventListener('gripdown', function (evt) { // vive, oculus
            console.log("Grip", evt);
            if (flip) nextImage(); else previousImage();
        });
        el.addEventListener('trackpaddown', function (evt) { // vive, gearvr, daydream
            console.log("Trackpad!", evt);
            if (flip) nextImage(); else previousImage();
        });
        /*
        // Note: setting neither cancelBubble nor defaultPrevented prevents AFrame from firing both buttondown and other event
        // until we figure out how to fire a single event, buttondown is disabled.
        el.addEventListener('buttondown', function (evt) {
            console.log("Click!", evt);
            el.setAttribute('visible', !el.getAttribute('visible'));
        });*/
    }
  });
