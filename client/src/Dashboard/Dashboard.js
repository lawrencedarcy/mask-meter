import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';
import Slider from 'react-slider-simple';
import Gauge from 'react-radial-gauge';



const database = require('../database.js');





function Dashboard(props) {
  const [currentLocation, setCurrentLocation] = useState();
  const [pollutionScore, setPollutionScore] = useState();
  const [coronaRate, setCoronaRate] = useState();
  const [coronaArea, setCoronaArea] = useState();
  const [postcode, setPostcode] = useState();
  const [locationData, setLocationData] = useState();
  const [sliderValue, setSliderValue] = useState(50);
  const [score, setScore] = useState(0);

  const getPostcodeFromLocation = (lat, lon) => {
    axios
      .get(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}?limit=1`)
      .then(function(response) {
        setPostcode(
          response.data.result[0].postcode || response.data.result.postcode
        );
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async function(position) {
        console.log('Latitude is :', position.coords.latitude);
        console.log('Longitude is :', position.coords.longitude);

        await getPostcodeFromLocation(
          position.coords.latitude,
          position.coords.longitude
        );
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude
        ]);
      });
    } else {
      alert('Current location is not Available');
    }
  };

  const getCoronaData = district => {
    console.log('district is', district);


    console.log(database.database.filter(entry => entry.area == district))

    const area = database.database.filter(entry => entry.area == district);
    setCoronaArea(area[0].area)
    setCoronaRate((area[0].number/500*10).toFixed(2));

  };

  const getPollutionData = (lat, lon) => {
    console.log('pollution function called');
    axios
      .get(
        `https://api.climacell.co/v3/weather/nowcast?lat=${lat}&lon=${lon}&unit_system=si&timestep=5&start_time=now&fields=epa_aqi&apikey=RS4vSGHNvWvXcRE2J0MMCfLTsFzoVQBa`
      )
      .then(function(response) {
        setPollutionScore(response.data[0].epa_aqi.value / 10 / 2);
        console.log('pol score', pollutionScore)
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getDataFromPostcode = postcode => {
    axios
      .get(`https://api.postcodes.io/postcodes/${postcode}`)
      .then(function(response) {
        console.log(response.data.result);
        setLocationData(response.data.result);

        return response;
      })
      .then(function(response) {
        getPollutionData(
          response.data.result.latitude,
          response.data.result.longitude
        );
        getCoronaData(
          response.data.result.admin_county ||
            response.data.result.admin_district
        );
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  
  const handleChange = event => {
    setPostcode(event.target.value);
  };

  const handleSubmit = event => {
    event.preventDefault();
    getDataFromPostcode(postcode);
  };

  const coronaLevel = num => {
    if (num > 7) return 'high';
    if (num > 4) return 'medium';
    if (num > 2) return 'low';
    if (num > 0) return 'very low';
  };

  const pollutionLevel = num => {
    if (num > 9.9) return 'very unhealthy';
    if (num > 7.5) return 'unhealthy';
    if (num > 5) return 'unhealthy for some';
    if (num > 2.5) return 'moderate';
    if (num > 0) return 'low';
  };

  const sliderHandler = (num) => {
    setSliderValue(num);
  }
  const sliderDoneHandler = (percent) => {
    console.log(`I'm done. here's the value: ${percent}`);
  };


  const calcScore = () => {

    let pol = pollutionScore;
    let cor = Number(coronaRate);

    if (sliderValue <= 50) {
      pol = pol * ((sliderValue*2)/100);
      cor = cor * ((100 - sliderValue)/100)*2;
    }
    if (sliderValue > 50) {
      cor = (cor * ((100-sliderValue)/100))*2;
      pol = pol * ((sliderValue)/100)*2;
    }

    return (((cor+pol)/2) * 10).toFixed(0);
  }

  return (
    <div className='dashboard'>
      <form onSubmit={handleSubmit} className='postcode-form'>
      <div className='intro-text'> MaskMeter uses current COVID-19 and air quality data to help you decide whether to wear a mask today.</div>
        <label>
          <div className='gauge-container'>
          <div className='mask-meter-corona level-container'>
            {' '}
            {coronaRate && (
              <p>
                In {coronaArea}, the relative Corona rate is currently{' '}
                <div className='level-text'>{coronaLevel(coronaRate)}</div>
              </p>
            )}{' '}
          </div>
        <Gauge 
        className='gauge'
        currentValue={calcScore()}
        dialColor='#a0e3a6'
        progressColor='#4e8d52'
        tickColor='#4e8d52'
        needleColor='#4e8d52'
        needleBaseColor='#4e8d52'
        />
         <div className='mask-meter-pollution level-container'>
            {' '}
            {pollutionScore && (
              <p>
              The pollution level in {coronaArea} is currently{' '}
              <div className='level-text'>{pollutionLevel(pollutionScore)}</div></p>
            )}
          </div>
        </div>
          <div className='postcode-block'>
            <div>
            Enter a postcode or{' '}
            <span className='current-location' onClick={getLocation}>
              use your current location
            </span>{' '}
          </div>
          <input
            className='postcode-input'
            type='text'
            name='name'
            value={postcode}
            onChange={handleChange}
          />
          </div>
        </label>
        <div>I am most concerned about:</div>
        <div className='slider-scale'><span className='scale-item'>Corona virus</span> <span>Pollution</span></div>
       <div className='slider-container'>
        <Slider
          value={sliderValue}
          onChange={sliderHandler}
          onDone={sliderDoneHandler}
          thumbColor='#66c2ca'
          shadowColor='#A0DDE3'
          sliderPathColor='#A0DDE3'
          className='slider'
        />
        </div>
        <input className='postcode-btn' type='submit' value='Generate score'  />
      </form>
     

    
      </div>
   
  );
}

export default Dashboard;
