const express = require('express');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
const jpeg = require('jpeg-js');

const MAX_ACCOUNT_ID_LENGTH = 20;
const FORM_CENTER = 400;
const GENDER_CENTER = 312;
const AGE_CENTER = 482;
const ACCOUNT_Y = 389;
const GENDER_Y = 440
const AGE_Y = 440;
const CONTACT_DETAILS_Y = 490;
const PROFESSION_Y = 540;
const REFERRER_Y = 593;
const MAX_GENDER_LENGTH = 12;
const MAX_AGE_LENGTH = 12;
const MAX_CONTACT_DETAILS_LENGTH = 35;
const MAX_PROFESSION_LENGTH = 20;

const app = express();

const iconData = fs.readFileSync('icon.png');

registerFont('font.ttf', { family: 'CustomFont' });

app.get('/icon.png', (req, res) => {
    res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
    });

    res.send(iconData);
});

app.get('/:account/:referrer/:gender/:age/:profession/*', async (req, res) => {
    const { account, referrer, gender, age, profession } = req.params;
    const contactDetails = req.path.split('/').slice(6).join('/');

    const jpegData = fs.readFileSync('signup-sheet.jpeg');
    const rawImageData = jpeg.decode(jpegData);

    const canvas = createCanvas(rawImageData.width, rawImageData.height);
    const ctx = canvas.getContext('2d');

    const imageData = ctx.createImageData(
        rawImageData.width,
        rawImageData.height
    );
    imageData.data.set(rawImageData.data);
    ctx.putImageData(imageData, 0, 0);

    const fontSize = 30;
    const fontColor = '#532216';

    ctx.font = `${fontSize}px CustomFont`;
    ctx.fillStyle = fontColor;

    const displayAccount = decodeURI(account.length > MAX_ACCOUNT_ID_LENGTH ? `${account.slice(0, MAX_ACCOUNT_ID_LENGTH)}...` : account);
    const accountWidth = ctx.measureText(`${displayAccount}`).width;

    const displayReferrer = decodeURI(referrer.length > MAX_ACCOUNT_ID_LENGTH ? `${referrer.slice(0, MAX_ACCOUNT_ID_LENGTH)}...` : referrer);
    const referrerWidth = ctx.measureText(`${displayReferrer}`).width;

    const displayGender = decodeURI(gender.length > MAX_GENDER_LENGTH ? `${gender.slice(0, MAX_GENDER_LENGTH)}...` : gender);
    const genderWidth = ctx.measureText(`${displayGender}`).width;

    const displayAge = decodeURI(age.length > MAX_AGE_LENGTH ? `${age.slice(0, MAX_AGE_LENGTH)}...` : age);
    const ageWidth = ctx.measureText(`${displayAge}`).width;

    const displayProfession = decodeURI(profession.length > MAX_PROFESSION_LENGTH ? `${profession.slice(0, MAX_PROFESSION_LENGTH)}...` : profession);
    const professionWidth = ctx.measureText(`${displayProfession}`).width;

    const accountX = FORM_CENTER - accountWidth / 2;
    const referrerX = FORM_CENTER - referrerWidth / 2;
    const genderX = GENDER_CENTER - genderWidth / 2;
    const ageX = AGE_CENTER - ageWidth / 2;
    const professionX = FORM_CENTER - professionWidth / 2;
    
    ctx.fillText(`${displayAccount.replace("%20", " ")}`, accountX, ACCOUNT_Y);
    ctx.fillText(`${displayReferrer.replace("%20", " ")}`, referrerX, REFERRER_Y);
    ctx.fillText(`${displayGender.replace("%20", " ")}`, genderX, GENDER_Y);
    ctx.fillText(`${displayAge.replace("%20", " ")}`, ageX, AGE_Y);
    ctx.fillText(`${displayProfession.replace("%20", " ")}`, professionX, PROFESSION_Y);

    if (contactDetails.length > 20) {
        ctx.font = `${fontSize - 4}px CustomFont`;
    }
    if (contactDetails.length > 28) {
        ctx.font = `${fontSize - 8}px CustomFont`;
    }
    const displayContactDetails = decodeURI(contactDetails.length > MAX_CONTACT_DETAILS_LENGTH ? `${contactDetails.slice(0, MAX_CONTACT_DETAILS_LENGTH)}...` : contactDetails);
    const contactDetailsWidth = ctx.measureText(`${displayContactDetails}`).width;
    const contactDetailsX = FORM_CENTER - contactDetailsWidth / 2;
    ctx.fillText(`${displayContactDetails.replace("%20", " ")}`, contactDetailsX, CONTACT_DETAILS_Y);

    const buffer = canvas.toBuffer();

    res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600'
    });

    res.send(buffer);
});

app.use((req, res) => {
    res.status(404).send('404 Not Found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});