let highlightRect = null; // keep track of the current box

function drawResultBox(innerMap, loc, isCorrect) {
    // remove the previous box if one exists
    if (highlightRect) {
        highlightRect.setMap(null);
    }

    const c = loc.corners;

    // Determine colors
    const strokeColor = isCorrect ? "#27ae60" : "#c0392b";   // green / red
    const fillColor   = isCorrect ? "#2ecc71" : "#e74c3c";

    // Create rectangle bounds
    const bounds = {
        north: c.upperLeft.lat,
        south: c.bottomLeft.lat,
        east:  c.upperRight.lng,
        west:  c.upperLeft.lng,
    };

    // Create the rectangle overlay
    highlightRect = new google.maps.Rectangle({
        map: innerMap,
        bounds: bounds,
        strokeColor: strokeColor,
        strokeWeight: 3,
        fillColor: fillColor,
        fillOpacity: 0.25,
        clickable: false,
    });
}
