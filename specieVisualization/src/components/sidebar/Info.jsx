import React, { useState, useEffect } from 'react';
import { IoMdFemale, IoMdMale } from "react-icons/io";
import { FaEgg, FaPerson } from "react-icons/fa6";
import { FaBaby } from "react-icons/fa";
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Carrusel from "./Carrusel";

const Info = ({ jsonInfo }) => {
  const [formattedInfo, setFormattedInfo] = useState([]);
  const [occurrencesTotal, setOccurrencesTotal] = useState(0);
  const [scientificName, setScientificName] = useState('');
  const [identifier, setIdentifier] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCountryInfo = async (text) => {
    try {
      const response = await fetch(`https://restcountries.com/v3.1/alpha/${text.toLowerCase()}`);
      if (!response.ok) {
        throw new Error('Country not found');
      }
      const countryData = await response.json();
      const name = countryData[0]['name']['common'];
      const flag = countryData[0]['flags']['svg'];
      return {'name': name, 'flag': flag};
    } catch (error) {
      console.error('Error fetching country information:', error);
      return {'name': text, 'flag': null}; // En caso de error, devolver el código original
    }
  };

  const getLabel = async (text) => {
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
              {text === "FEMALE" ? <IoMdFemale /> : (
                text === "MALE" ? <IoMdMale /> : (
                  text === "Adult" ? <FaPerson /> : (
                    text === "Juvenile" ? <FaBaby /> : <FaEgg />
                  )
                ))}
            </IconButton>
          </Tooltip>
        ); 
      default:
        const countryInfo = await getCountryInfo(text);
        return (
          <Tooltip title={countryInfo.name} placement="top" arrow>
            <IconButton>
            {countryInfo.flag && <img src={countryInfo.flag} alt={`${countryInfo.name} flag`} width="20" />}
            </IconButton>
          </Tooltip>
        );
    }
  };

  const continentLabelFormat = (text) => {
    return text.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatList = async (list, isContinent) => {
    let result = [];
    for (let i = 0; i < list.length; i += 2) {
      const label = isContinent ? continentLabelFormat(list[i]) : await getLabel(list[i]);
      result.push(
        <span key={i}>
          {label}: {list[i + 1]}{i + 1 === list.length - 1 ? '.' : ', '}
        </span>
      );
    }
    return result;
  };

  useEffect(() => {
    const formatData = async () => {
      setLoading(true)
      const sex = await formatList(jsonInfo?.sex || [], false);
      const lifeStage = await formatList(jsonInfo?.lifeStage || [], false);
      const continent = await formatList(jsonInfo?.continent || [], true);
      const countryCode = await formatList(jsonInfo?.countryCode || [], false);
      setFormattedInfo({ sex, lifeStage, continent, countryCode });
      setOccurrencesTotal(jsonInfo?.family[1])
      setScientificName(jsonInfo?.scientificName)
      setIdentifier(jsonInfo?.identifier)
      setLoading(false)
    };

    formatData();
  }, [jsonInfo]);

  return (
    <div className="info-container">
      {!loading ? (
        <div className="info-group">
          <div className="info-header">
            <h3 className="scientific-name">{scientificName}</h3>
            <div className="occurrences">
              <p className="occurrences-total">{occurrencesTotal}</p>
              <p className="occurrences-label">occurrences</p>
            </div>
          </div>
          {identifier.length != 0 && <Carrusel images={identifier} />}
          <div className="info-paragraph">
            <div className="grid-container">
              <div className="grid-item">
                {(formattedInfo.sex).length != 0 && <p><b>Sex:</b> {formattedInfo.sex}</p>}
                {(formattedInfo.lifeStage).length != 0 && <p><b>Life stage:</b> {formattedInfo.lifeStage}</p>}
                {(formattedInfo.continent).length != 0 && <p><b>Continent:</b> {formattedInfo.continent}</p>}
                {(formattedInfo.countryCode).length != 0 && <p><b>Country code:</b> {formattedInfo.countryCode}</p>}
              </div>
            </div>
          </div>
        </div> 
      ): (<h3 className="text-xl font-bold"> Waiting for info </h3>)}
    </div>
  );
};

export default Info;
