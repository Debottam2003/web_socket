document.querySelector('form').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Here you can add your login logic, e.g., sending the data to a server
    console.log('email:', email);
    console.log('Password:', password);

    try {
        let response = await fetch('http://localhost:3333/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok || response.status !== 200) {
            console.error('Login failed');
            return;
        }
        else {
            let data = await response.json();
            console.log('Login successful:', data);
            localStorage.setItem("user", data.user);
            window.location.href = 'users.html'; // Redirect to dashboard or another page
        }
    } catch (err) {
        console.error('Error during login:', err);
        alert('Login failed. Please try again.');
    }

});