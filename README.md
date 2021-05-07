# Google Cloud Text-to-Speech Script for Firebot

## Overview
Use Google Cloud's Text-to-Speech service in Firebot to have incredible TTS quality on stream! Choose from any English (US/UK/AU/IN) WaveNet voice. With controls for Pitch and Speech Rate, you can tailor the voice to whatever you need.

Looking to recreate the voice of A.D.A (Artificial Directory and Assistant) from Satisfactory? Choose `en-US-Wavenet-C` and adjust the Pitch to `-0.5` and Speed to `0.9`.

## Prerequisites
You must have a Google Cloud Account, and a [Google Cloud API Key](https://cloud.google.com/docs/authentication/api-keys#creating_an_api_key) to use this script. Technically this is a paid service, however, each month Google will give you 1,000,000 free characters of TTS. If you exceed that, they charge USD $16 for every additional bucket of 1,000,000 characters.

In addition to obtaining your API Key, you must also activate and enable Google Cloud Text-to-Speech by following this [this link](https://console.cloud.google.com/apis/library/texttospeech.googleapis.com).

The API Key may look something like: `AITEwL55bWmT-zZeuiWF8o9EpruWtue7QUhMy05`

Make sure you have your API Key handy, as you'll need it once you install the Script in Firebot.

## How to use
1. Download the latest **googleCloudTts.js** file from [Releases](https://github.com/heyaapl/firebot-script-google-cloud-tts/releases)
2. Add the **googleCloudTts.js** as a startup script in Firebot (Settings > Advanced > Startup Scripts) and enter your Google Cloud API Key
3. Restart Firebot and enjoy! You'll see a new Effect called **Google Cloud Text-to-Speech**!