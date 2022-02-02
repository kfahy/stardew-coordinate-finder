const coloredSpots = {};

function drawBackgroundImage(backgroundCanvas, src) {
    return new Promise(resolve => {
        const image = new Image();
        image.addEventListener('load', () => {
            const { width, height } = image;
            backgroundCanvas.width = width;
            backgroundCanvas.height = height;
            const stageDiv = backgroundCanvas.parentElement;
            stageDiv.style = `height: ${height}px; width: ${width}px;`;

            const ctx = backgroundCanvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            ctx.strokeStyle = '#fffa';
            for (let x = 0; x <= width; x += 16) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = 0; y <= height; y += 16) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            resolve([width, height]);
        });

        image.src = src;
    });
}

function initMap(title, src) {
    const titleHeading = document.createElement('h2');
    titleHeading.innerText = title;
    document.body.appendChild(titleHeading);

    const stageDiv = document.createElement('div');
    stageDiv.className = 'canvas-stage';
    document.body.appendChild(stageDiv);

    const backgroundCanvas = document.createElement('canvas');
    stageDiv.appendChild(backgroundCanvas);

    drawBackgroundImage(backgroundCanvas, src).then(([width, height]) => {
        const frontCanvas = document.createElement('canvas');
        frontCanvas.width = width;
        frontCanvas.height = height;
        frontCanvas.id = `${title}-front-canvas`;
        stageDiv.appendChild(frontCanvas);

        const ctx = frontCanvas.getContext('2d');
        let highlightedCoord = null;
        frontCanvas.addEventListener('mousemove', ({offsetX, offsetY}) => {
            const x = Math.floor(offsetX / 16);
            const y = Math.floor(offsetY / 16);
            const coloredSpot = coloredSpots[title]?.[x]?.[y];
            const coloredSpotText = coloredSpot ? `${coloredSpot.join(', ')} ` : '';
            tooltip.innerText = `${coloredSpotText}(${x},${y})`;

            if (highlightedCoord) {
                const [oldX, oldY] = highlightedCoord;
                if (x === oldX && y === oldY) {
                    // User didn't move out of the square, so keep old highlight.
                    return;
                }

                ctx.clearRect(oldX * 16 + 1, oldY * 16 + 1, 14, 14);

                // This spot was already occupied, so re-color it.
                if (coloredSpots[title]?.[oldX]?.[oldY]) {
                    ctx.fillStyle = '#ff0a';
                    ctx.fillRect(oldX * 16 + 1, oldY * 16 + 1, 14, 14);
                }
            }

            ctx.fillStyle = '#fffa';
            ctx.fillRect(x * 16 + 1, y * 16 + 1, 14, 14);
            highlightedCoord = [x, y];
        });
    });
}

function colorSpots(spots) {
    const spotKeys = Object.keys(spots);
    for (const spotKey of spotKeys) {
        const spot = spots[spotKey];

        const [mapName, xStr, yStr, , modifier] = spot.split(' ');
        const x = Number(xStr);
        const y = Number(yStr);
        const frontCanvas = document.querySelector(`#${mapName}-front-canvas`);
        if (!frontCanvas) {
            console.error('bad map name in spots.json:', mapName);
            return;
        }

        let squareX = 1;
        let squareY = 1;
        if (modifier?.startsWith('square_')) {
            [ , squareX, squareY] = modifier.split('_');
            squareX = Number(squareX);
            squareY = Number(squareY);
        }
        const initialX = x - Math.floor(squareX / 2);
        const initialY = y - Math.floor(squareY / 2);

        for (let offsetX = 0; offsetX < squareX; offsetX++) {
            for (let offsetY = 0; offsetY < squareY; offsetY++) {
                const finalX = initialX + offsetX;
                const finalY = initialY + offsetY;
                if (!coloredSpots[mapName]) {
                    coloredSpots[mapName] = {};
                }
                if (!coloredSpots[mapName][finalX]) {
                    coloredSpots[mapName][finalX] = {};
                }
                if (!coloredSpots[mapName][finalX][finalY]) {
                    coloredSpots[mapName][finalX][finalY] = [];
                }
                const spotAlreadyColored = coloredSpots[mapName][finalX][finalY].length;
                coloredSpots[mapName][finalX][finalY].push(spotKey);

                if (!spotAlreadyColored) {
                    const ctx = frontCanvas.getContext('2d');
                    ctx.fillStyle = '#ff0a';
                    ctx.fillRect(finalX * 16 + 1, finalY * 16 + 1, 14, 14);
                }
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const mapFilenames = [
        'maps/AnimalShop.png',
        'maps/ArchaeologyHouse.png',
        'maps/BathHouse_Entry.png',
        'maps/BathHouse_MensLocker.png',
        'maps/BathHouse_WomensLocker.png',
        'maps/Beach.png',
        'maps/Blacksmith.png',
        'maps/BusStop.png',
        'maps/CommunityCenter.png',
        'maps/ElliottHouse.png',
        'maps/FishShop.png',
        'maps/Forest.png',
        'maps/HaleyHouse.png',
        'maps/HarveyRoom.png',
        'maps/Hospital.png',
        'maps/JojaMart.png',
        'maps/JoshHouse.png',
        'maps/LeahHouse.png',
        'maps/ManorHouse.png',
        'maps/Mountain.png',
        'maps/Railroad.png',
        'maps/Saloon.png',
        'maps/SamHouse.png',
        'maps/ScienceHouse.png',
        'maps/SebastianRoom.png',
        'maps/SeedShop.png',
        'maps/Sunroom.png',
        'maps/Tent.png',
        'maps/Town.png',
        'maps/Trailer.png',
        'maps/Trailer_Big.png'
    ];
    const titleRegex = /maps\/([^.]+)/;
    for (const mapFilename of mapFilenames) {
        const title = mapFilename.match(titleRegex)[1];
        initMap(title, mapFilename);
    }

    // Set up file drop handler for filling in squares based on spots.json.
    document.body.addEventListener('dragover', (event) => {
        event.preventDefault();
    });

    document.body.addEventListener('drop', (event) => {
        event.preventDefault();

        if (event.dataTransfer.files.length !== 1) {
            return;
        }

        event.dataTransfer.files[0].text().then((text) => {
            const { spots } = JSON.parse(text);
            colorSpots(spots);
        });
    });
});
