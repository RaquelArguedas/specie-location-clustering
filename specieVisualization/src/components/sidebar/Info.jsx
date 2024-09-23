import React, { useState } from 'react';
import { IoMdFemale, IoMdMale } from "react-icons/io";
import { FaEgg, FaPerson } from "react-icons/fa6";
import { FaBaby } from "react-icons/fa";
import Carrusel from "./Carrusel";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

const Info = ({ jsonInfo }) => {
  const [countryName, setCountryName] = useState('')
  const [countryFlag, setCountryFlag] = useState('')

  const getCountryInfo = async (text) => {
    try {
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${text.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Country not found');
      }
      const countryData = await response.json();
      const name = countryData[0]['name']['common'];
      const flag = countryData[0]['flags']['svg'];
      setCountryName(name)
      setCountryFlag(flag)
    } catch (error) {
      console.error('Error fetching country information:', error);
    }
  }

  const getLabel = (text) => {
    switch (text) {
      case 'FEMALE':
      case 'MALE':
      case 'Adult':
      case 'Juvenile':
      case 'Egg':
        const formatText = text[0].toUpperCase() + text.slice(1).toLowerCase();
        return (
          <Tooltip title={formatText} placement="top" arrow>
            <IconButton>
              {text == "FEMALE" ? <IoMdFemale /> : (
                text == "MALE" ? <IoMdMale /> : (
                  text == "Adult" ? <FaPerson /> : (
                    text == "Juvenile" ? <FaBaby /> : <FaEgg />
                  )
                ))}
            </IconButton>
          </Tooltip>
          ); 
      default:
        getCountryInfo(text);
        console.log('countryName', countryName)
        return <span>{text}</span>;
    }
  }

  const continentLabelFormat = (text) => {
    return text.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  const formatList = (list, isContinent) => {
    let result = []
    for (let i = 0; i < list.length; i += 2) {
      result.push(
        <span>
          {isContinent ? continentLabelFormat(list[i]) : getLabel(list[i])}: {list[i + 1].toString()}{i + 1 === list.length - 1 ? '.' : ', '}
        </span>
      );
    }
    return result
  }

  return (
    <div className="info-container">
      {jsonInfo && 
        <div className="info-group">
          <h3 className="text-xl font-bold"> {jsonInfo?.scientificName}</h3>
          <Carrusel images={jsonInfo?.identifier ?? []}/>
          <div className="info-paragraph">
            <div className="grid-container">
              <div className="grid-item">
                {(jsonInfo?.sex).length != 0 && <p><b>Sex:</b> {formatList(jsonInfo?.sex, false)}</p>}
                {(jsonInfo?.lifeStage).length != 0 && <p><b>Life stage:</b> {formatList(jsonInfo?.lifeStage, false)}</p>}
                {(jsonInfo?.continent).length != 0 && <p><b>Continent:</b> {formatList(jsonInfo?.continent, true)}</p>}
                {(jsonInfo?.countryCode).length != 0 && <p><b>Country code:</b> {formatList(jsonInfo?.countryCode, false)}</p>}
              </div>
            </div>
          </div>
        </div> 
      } 
    </div>
  );
};

export default Info;