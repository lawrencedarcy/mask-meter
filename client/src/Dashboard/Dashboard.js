import React, { useState } from 'react';
import './Dashboard.css';
import axios from 'axios';
import Slider from 'react-slider-simple';
import Gauge from 'react-radial-gauge';
import 'react-loader-spinner/dist/loader/css/react-spinner-loader.css';
import Loader from 'react-loader-spinner';

const database = require('../database.js');

function Dashboard(props) {
  const [currentLocation, setCurrentLocation] = useState();
  const [pollutionScore, setPollutionScore] = useState();
  const [coronaRate, setCoronaRate] = useState();
  const [coronaArea, setCoronaArea] = useState();
  const [postcode, setPostcode] = useState();
  const [locationData, setLocationData] = useState();
  const [sliderValue, setSliderValue] = useState(50);
const [postcodeError, setPostcodeError] = useState(false);
const [loadingLocation, setLoadingLocation] = useState(false);
  let gaugeBackground = '#a0e3a6';
  let gaugeProgress = '#4e8d52';

  

  const getPostcodeFromLocation = (lat, lon) => {
    axios
      .get(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}?limit=1`)
      .then(function(response) {
        setPostcode(
          response.data.result[0].postcode || response.data.result.postcode
        );
        setLoadingLocation(false);
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getLocation = () => {
    setLoadingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async function(position) {
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
    const area = database.database.filter(entry => entry.area === district);
    setCoronaArea(area[0].area);
    setCoronaRate(((area[0].number / 500) * 10).toFixed(2));
  };

  const getPollutionData = (lat, lon) => {
    axios
      .get(
        `https://api.climacell.co/v3/weather/nowcast?lat=${lat}&lon=${lon}&unit_system=si&timestep=5&start_time=now&fields=epa_aqi&apikey=RS4vSGHNvWvXcRE2J0MMCfLTsFzoVQBa`
      )
      .then(function(response) {
        setPollutionScore(response.data[0].epa_aqi.value / 10 / 2);
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getDataFromPostcode = postcode => {
    axios
      .get(`https://api.postcodes.io/postcodes/${postcode}`)
      .then(function(response) {
        setLocationData(response.data.result);
        return response;
      })
      .then(function(response) {
       
        getPollutionData(
          response.data.result.latitude,
          response.data.result.longitude
        );
        if (response.data.result.country === 'Scotland') {
          setCoronaRate(((273 / 500) * 10).toFixed(2));
          setCoronaArea('Scotland');
        }
        if (response.data.result.country === 'Wales') {
          setCoronaRate(((404 / 500) * 10).toFixed(2));
          setCoronaArea('Wales');
        }
        if (response.data.result.country === 'Northern Ireland') {
          setCoronaRate(((283 / 500) * 10).toFixed(2));
          setCoronaArea('Northern Ireland');
        } else {
          getCoronaData(
            response.data.result.admin_county ||
              response.data.result.admin_district
          );
        }
      })
      .catch(function(error) {
        setPostcodeError(true);
      });
  };

  const handleChange = event => {
    setPostcodeError(false);
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
    if (num >= 9.9) return 'very unhealthy';
    if (num >= 7.5) return 'unhealthy';
    if (num >= 5) return 'unhealthy for some';
    if (num >= 2.5) return 'moderate';
    if (num > 0) return 'good';
  };

  const sliderHandler = num => {
    setSliderValue(num);
  };
  const sliderDoneHandler = percent => {};

  const calcScore = () => {
    if (pollutionScore == undefined) return 0;
    let pol = pollutionScore;
    let cor = Number(coronaRate);

    if (sliderValue <= 50) {
      pol = pol * ((sliderValue * 2) / 100);
      cor = cor * ((100 - sliderValue) / 100) * 2;
    }
    if (sliderValue > 50) {
      cor = cor * ((100 - sliderValue) / 100) * 2;
      pol = pol * (sliderValue / 100) * 2;
    }

    if ((((cor + pol) / 2) * 10).toFixed(0) > 40) {
      gaugeBackground = '#F9D597';
      gaugeProgress = '#EEAE40';
    }

    if ((((cor + pol) / 2) * 10).toFixed(0) > 70) {
      gaugeBackground = '#FDB0B0';
      gaugeProgress = '#FF3F3F ';
    }

    return (((cor + pol) / 2) * 10).toFixed(0);
  };

  return (
    <div className='dashboard'>
      <form onSubmit={handleSubmit} className='postcode-form'>
        <div className='intro-text'>
          {' '}
          MaskMeter uses current COVID-19 and air quality data from your local
          area to help you to decide whether to wear a face mask. Created by{' '}
          <a href='https://lawrencewakefield.netlify.app/' target='_blank'>
            Lawrence Wakefield
          </a>
          .
        </div>

        <label>
          {pollutionScore != undefined && (
            <div className='gauge-wrapper'>
              <div className='gauge-header'>Your MaskMeter score</div>
              <div className='gauge-container'>
                <div className='mask-meter-corona level-container'>
                  {' '}
                  {coronaRate && (
                    <div>
                      <img
                        className='mask'
                        alt='corona'
                        src='https://uploads.guim.co.uk/2020/05/19/bacteria.png'
                      ></img>
                      <div className='p'>
                        In {coronaArea}, the relative Corona rate is currently
                        <div className='level-text'>
                          {coronaLevel(coronaRate)}
                        </div>
                      </div>
                    </div>
                  )}{' '}
                </div>
                <Gauge
                  className='gauge'
                  currentValue={calcScore()}
                  dialColor={gaugeBackground}
                  progressColor={gaugeProgress}
                  needleColor={gaugeProgress}
                  needleBaseColor={gaugeBackground}
                />
                <div className='mask-meter-pollution level-container'>
                  {' '}
                  {pollutionScore && (
                    <div>
                      <img
                        className='mask'
                        alt='pollution'
                        src='https://uploads.guim.co.uk/2020/05/19/acid-rain.png'
                      ></img>
                      <div className='p'>
                        The air quality in your area is currently{' '}
                        <div className='level-text'>
                          {pollutionLevel(pollutionScore)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className='disclaimer'>
                <b>Sources:</b> COVID-19 rate based on Public Health England
                recorded cases per 100,000 population. Air quality data uses the{' '}
                <a href='https://www3.epa.gov/airnow/aqi_brochure_02_14.pdf'>
                  EPA AQI
                </a>
                .<b> MaskMeter is only intended as an indicator </b>and you
                should follow government and{' '}
                <a href='https://www.who.int/publications-detail/advice-on-the-use-of-masks-in-the-community-during-home-care-and-in-healthcare-settings-in-the-context-of-the-novel-coronavirus-(2019-ncov)-outbreak'>
                  WHO guidance
                </a>{' '}
                on face masks.
              </div>
            </div>
          )}
          <div className='postcode-block'>
            <div>
              Enter a UK postcode or{' '}
              <span className='current-location' onClick={getLocation}>
                use your current location
              </span>{' '}
            </div>
            {loadingLocation ? <Loader type='ThreeDots' color='#A0DDE3' height={77} width={60} />
            
            : <input
              className='postcode-input'
              type='text'
              name='name'
              value={postcode}
              onChange={handleChange}
            />}
          </div>
        </label>
        <div>I am most concerned about:</div>
        <div className='slider-scale'>
          <span className='scale-item'>Corona virus</span>{' '}
          <span>Pollution</span>
        </div>
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
        <input
          className='postcode-btn'
          type='submit'
          value={pollutionScore ? 'Regenerate score' : 'Generate score'}
        />
        {<div className={postcodeError ? 'error' : 'hide'} >Please enter a valid postcode.</div>}
      </form>
    </div>
  );
}

export default Dashboard;
