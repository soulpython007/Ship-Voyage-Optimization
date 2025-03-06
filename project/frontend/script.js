document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost:5000/api/data')
        .then(response => response.json())
        .then(data => {
            document.getElementById('output').innerHTML = `
                <h3>${data.message}</h3>
                <ul>${data.routes.map(route => `<li>${route}</li>`).join('')}</ul>
            `;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('output').innerText = 'Error fetching data from backend.';
        });
});
