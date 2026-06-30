function createAlert(id, text) {
    const alert = document.createElement('div');
    alert.id = id;
    alert.className = 'alert-text';
    alert.innerText = text;
    alert.style.display = 'none';
    alert.style.position = 'absolute';
    alert.style.top = '20%';
    alert.style.left = '50%';
    alert.style.transform = 'translate(-50%, -50%)';
    alert.style.fontSize = '2rem';
    alert.style.fontWeight = 'bold';
    alert.style.zIndex = '1000';
    alert.style.pointerEvents = 'none';
    document.body.appendChild(alert);
    return alert;
}
