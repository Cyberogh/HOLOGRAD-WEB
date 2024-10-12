const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Function to generate image with user's name
const generateImageWithName = async (name, imageUrl) => {
    const image = await loadImage(imageUrl);
    const canvasWidth = image.width;
    const canvasHeight = image.height;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = 'black';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';

    // Draw the name onto the canvas
    ctx.fillText(name, 135, 490); // Adjust positioning as needed

    // Create a buffer from the canvas
    return canvas.toBuffer('image/png');
};

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Store user profiles in memory
const userProfiles = {};

// Serve the form page
app.get('/', (req, res) => {
    res.send(`
        <h1>Offer Letter Generator</h1>
        <form action="/generate" method="POST" enctype="multipart/form-data">
            <label for="name">Intern's Name:</label>
            <input type="text" id="name" name="name" required><br>
            <label for="email">Intern's Email:</label>
            <input type="email" id="email" name="email" required><br>
            <label for="designation">Designation:</label>
            <select id="designation" name="designation" required>
                <option value="HR">HR</option>
                <option value="Marketing">Marketing</option>
            </select><br>
            <label for="dateOfJoining">Date of Joining:</label>
            <input type="date" id="dateOfJoining" name="dateOfJoining" required><br>
            <label for="aadharCard">Upload Aadhar Card (PNG, JPG, JPEG, HEVC, PDF, max 20MB):</label>
            <input type="file" id="aadharCard" name="aadharCard" accept=".png, .jpg, .jpeg, .hevc, .pdf" required><br>
            <label for="collegeId">Upload College ID (PNG, JPG, JPEG, HEVC, PDF, max 20MB):</label>
            <input type="file" id="collegeId" name="collegeId" accept=".png, .jpg, .jpeg, .hevc, .pdf" required><br>
            <label for="profilePic">Upload Profile Picture:</label>
            <input type="file" id="profilePic" name="profilePic" accept="image/*" required><br>
            <button type="submit">Generate Offer Letter</button>
        </form>
    `);
});

// Modify the user profile storage in the /generate route
app.post('/generate', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'aadharCard', maxCount: 1 },
    { name: 'collegeId', maxCount: 1 }
]), async (req, res) => {
    const { name, email, designation, dateOfJoining } = req.body;
    const profilePicPath = req.files['profilePic'] ? `/uploads/${req.files['profilePic'][0].filename}` : null;
    const aadharCardPath = req.files['aadharCard'] ? `/uploads/${req.files['aadharCard'][0].filename}` : null;
    const collegeIdPath = req.files['collegeId'] ? `/uploads/${req.files['collegeId'][0].filename}` : null;

    // Image URL for the first offer letter image
    const imageUrl = "https://i.ibb.co/3mh6YcJ/1.png";

    // Load the image to get its dimensions
    const image = await loadImage(imageUrl);
    const canvasWidth = image.width;
    const canvasHeight = image.height;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = 'black';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';

    // Draw the text onto the canvas
    ctx.fillText(name, 135, 490);
    ctx.fillText(email, 135, 530);
    ctx.fillText(dateOfJoining, 1130, 490);

    // Create a buffer from the canvas
    const buffer = canvas.toBuffer('image/png');

    // Create a base64 string to display the image in HTML
    const base64Image = buffer.toString('base64');
    const imgSrc = `data:image/png;base64,${base64Image}`;

    // Store user profile with KYC status and uploaded file paths
    userProfiles[name] = {
        email,
        designation,
        dateOfJoining,
        offerLetterImage: imgSrc,
        profilePic: profilePicPath,
        aadharCard: aadharCardPath, // Save Aadhar Card path
        collegeId: collegeIdPath, // Save College ID path
        kycVerified: false // Default KYC status
    };
    
    // Log the user profile creation
    console.log(`Profile created for: ${name}`);
    console.log('User Profiles:', userProfiles);
    
    // Redirect to the profile page
    res.redirect(`/${name}`);
});

const imageLinks = [
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png",
    "https://i.ibb.co/Y0wbvJT/2.png"
];

// Update the Admin Dashboard Route to display uploaded files
app.get('/admin', (req, res) => {
    console.log('Admin Dashboard accessed. Current User Profiles:', userProfiles);
    let userHtml = Object.keys(userProfiles).map(name => {
        const profile = userProfiles[name];
        return `
            <div>
                <h2>${name}</h2>
                <p>Email: ${profile.email}</p>
                <p>Designation: ${profile.designation}</p>
                <p>KYC: ${profile.kycVerified ? 'Verified' : 'Unverified'}</p>
                <p>Aadhar Card: <a href="${profile.aadharCard}" target="_blank">View</a></p>
                <p>College ID: <a href="${profile.collegeId}" target="_blank">View</a></p>
                <button onclick="toggleKYC('${name}')">${profile.kycVerified ? 'Unverify' : 'Verify'}</button>
                
                <!-- Add the nine buttons with links -->
                <div>
                ${imageLinks.map((link, index) => `
                    <a href="javascript:void(0)" onclick="addImageToProfile('${name}', '${link}')">
                        <button>Link ${index + 1}</button>
                    </a>
                `).join('')}                
                </div>
                <hr>
            </div>
        `;
    }).join('');

    res.send(`
        <h1>Admin Dashboard</h1>
        <div>${userHtml}</div>
        <script>
            function toggleKYC(name) {
                fetch('/admin/toggleKYC', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                })
                .then(response => location.reload());
            }

            function addImageToProfile(name, imageUrl) {
                fetch('/admin/addImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, imageUrl })
                })
                .then(response => location.reload());
            }
        </script>
    `);
});

// Profile route
// Function to generate image with user's name at a specified position
const generateImageWithCustomPosition = async (name, imageUrl, positionX, positionY, fontSize) => {
    const image = await loadImage(imageUrl);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw the image on the canvas
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Set text properties
    ctx.fillStyle = 'black';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'left';

    // Draw the name onto the canvas at the specified position
    ctx.fillText(name, positionX, positionY);

    // Create a buffer from the canvas
    return canvas.toBuffer('image/png');
};

// Route to serve user profile
app.get('/:name', (req, res) => {
    const { name } = req.params;
    const profile = userProfiles[name];

    if (!profile) {
        return res.status(404).send('Profile not found');
    }

    // Generate HTML for additional images
    const additionalImagesHtml = (profile.additionalImages || []).map(imageUrl => `
        <div class="offer-letter-image">
            <img src="${imageUrl}" alt="Additional Image">
        </div>
    `).join('');

    res.set('Content-Type', 'text/html');
    res.send(`
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f5f5dc;
                        margin: 0;
                        padding: 20px;
                    }
                    .header-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        margin-bottom: 20px;
                    }
                    .logo {
                        width: 150px;
                        margin-bottom: 10px;
                    }
                    .dashboard-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        width: 100%;
                        max-width: 800px;
                        background-color: #ffffff;
                        border-radius: 15px;
                        padding: 20px;
                        margin: 20px auto;
                        box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
                    }
                    .profile-details {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .profile-details p {
                        font-size: 18px;
                        color: #333;
                        text-align: left;
                    }
                    .profile-section {
                        display: flex;
                        align-items: center;
                        gap: 20px;
                    }
                    .profile-pic {
                        width: 150px;
                        height: 150px;
                        border-radius: 50%;
                        object-fit: cover;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    }
                    .offer-letter-section {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 30px;
                    }
                    .offer-letter-image {
                        width: 30%;
                        margin-right: 10px;
                    }
                    .offer-letter-image img {
                        width: 100%;
                        height: auto;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <img class="logo" src="https://i.ibb.co/S6KJZ4z/LOGO.png" alt="Logo">
                </div>

                <div class="dashboard-container">
                    <div class="profile-section">
                        ${profile.profilePic ? `<img class="profile-pic" src="${profile.profilePic}" alt="${name}'s profile picture">` : ''}
                        <div class="profile-details">
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${profile.email}</p>
                            <p><strong>Domain:</strong> ${profile.designation}</p>
                            <p><strong>Date of Joining:</strong> ${profile.dateOfJoining}</p>
                            <p><strong>KYC:</strong> ${profile.kycVerified ? 'Verified' : 'Unverified'}</p>
                        </div>
                    </div>

                    <div class="offer-letter-section">
                        <div class="offer-letter-image">
                            <img src="${profile.offerLetterImage}" alt="Offer Letter">
                        </div>
                        <div class="offer-letter-image">
                            <img src="https://i.ibb.co/Y0wbvJT/2.png" alt="Offer Letter 2">
                        </div>
                        <div class="offer-letter-image">
                            <img src="https://i.ibb.co/k2qFNCB/3.png" alt="Offer Letter 3">
                        </div>
                        ${additionalImagesHtml} <!-- Display additional images here -->
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Route to add image URL to user profile
app.post('/admin/addImage', async (req, res) => {
    const { name, imageUrl } = req.body;

    if (userProfiles[name]) {
        // Generate an image for the specific button pressed
        const position = { x: 135, y: 490, size: 28 }; // Example position
        const imageBuffer = await generateImageWithCustomPosition(name, imageUrl, position.x, position.y, position.size);
        
        const outputPath = path.join(uploadDir, `${Date.now()}_${name.replace(/\s/g, '_')}.png`);
        fs.writeFileSync(outputPath, imageBuffer);

        // Add the newly generated image to the user's additionalImages array
        if (!userProfiles[name].additionalImages) {
            userProfiles[name].additionalImages = []; // Initialize if it doesn't exist
        }
        userProfiles[name].additionalImages.push(`/uploads/${path.basename(outputPath)}`); // Append the new image
    }
    res.status(200).send('Image added to profile');
});




// Toggle KYC Status Route
app.post('/admin/toggleKYC', (req, res) => {
    const { name } = req.body;
    if (userProfiles[name]) {
        userProfiles[name].kycVerified = !userProfiles[name].kycVerified;
    }
    res.status(200).send('KYC status updated');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
