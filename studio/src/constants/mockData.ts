import { OntologyTerm } from '../types';

export const EXAMPLE_EML_XML = `<eml:eml xmlns:eml="https://eml.ecoinformatics.org/eml-2.2.0"
  xmlns:stmml="http://www.xml-cml.org/schema/stmml-1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" packageId="cos-spu.10.1"
  system="https://pasta.edirepository.org"
  xsi:schemaLocation="https://eml.ecoinformatics.org/eml-2.2.0 https://eml.ecoinformatics.org/eml-2.2.0/eml.xsd">
  <access authSystem="https://pasta.edirepository.org/authentication" order="allowFirst"
    scope="document" system="https://pasta.edirepository.org">
    <allow>
      <principal>SPU_EDI_Data_Author</principal>
      <permission>all</permission>
    </allow>
    <allow>
      <principal>corinna.gries@gmail.com</principal>
      <permission>all</permission>
    </allow>
    <allow>
      <principal>public</principal>
      <permission>read</permission>
    </allow>
  </access>
  <dataset>
    <alternateIdentifier system="https://doi.org">doi:10.6073/pasta/9f0f6d9ac6d818e6774cbbad7964c1b7</alternateIdentifier>
    <title>City of Seattle, Seattle Public Utilities, Amphibian Egg Mass Counts 2002 - Current,
      Cedar River Municipal Watershed, King County, WA</title>
    <creator>
      <individualName>
        <givenName>Heidy</givenName>
        <surName>Barnett</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
    </creator>
    <creator>
      <individualName>
        <givenName>Sally</givenName>
        <surName>Nickelson</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
    </creator>
    <creator>
      <individualName>
        <givenName>Alexander</givenName>
        <surName>May</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <userId directory="https://orcid.org">https://orcid.org/0000-0002-0013-1954</userId>
    </creator>
    <metadataProvider>
      <individualName>
        <givenName>Alexander</givenName>
        <surName>May</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <positionName>Wildlife Biologist</positionName>
      <address>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>United States</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/</onlineUrl>
      <userId directory="https://orcid.org">0000-0002-0013-1954</userId>
      <userId directory="https://isni.oclc.org/">0000 0000 8952 5196</userId>
    </metadataProvider>
    <associatedParty>
      <individualName>
        <givenName>Heidy</givenName>
        <surName>Barnett</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <role>Project originator and surveyor</role>
    </associatedParty>
    <associatedParty>
      <individualName>
        <givenName>Sally</givenName>
        <surName>Nickelson</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <role>Project originator and surveyor</role>
    </associatedParty>
    <associatedParty>
      <individualName>
        <givenName>Bill</givenName>
        <surName>Richards</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <role>Surveyor</role>
    </associatedParty>
    <associatedParty>
      <individualName>
        <givenName>David</givenName>
        <surName>Chapin</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <role>Surveyor</role>
    </associatedParty>
    <associatedParty>
      <individualName>
        <givenName>Melissa</givenName>
        <surName>Borsting</surName>
      </individualName>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
        <city>North Bend</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98045</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
      <role>Surveyor</role>
    </associatedParty>
    <pubDate>2025-10-01</pubDate>
    <abstract>
      <para>This data package contains survey data beginning in 2002 for amphibian egg masses in
        five small kettle lakes (known as "14 Lakes") in the Cedar River Municipal Watershed,
        located in King County, Washington, USA. These surveys are conducted annually and are
        intended to be continued. The lakes range in size from 0.8 to 4.3 acres, have no perennial
        inlet or outlet, and were formed through glacial outwash deposits. The lakes are located at
        an elevation of 800 feet and are well suited for pond breeding amphibians because the lakes
        have no fish. Surveys were conducted annually, typically during the last week of March or
        first week of April, to coincide with amphibian breeding seasons. Surveyors walked, waded,
        or paddled the perimeter of each of the lakes during a survey, and tallied the number and
        type of egg masses that were encountered. Red legged frogs (Rana aurora) were of specific
        interest for the surveys, though egg masses of other species were noted during some survey
        years. The lakes represent the largest known breeding concentration of red legged frogs in
        the municipal watershed. The water depth of the lakes fluctuates year-to-year, which
        affected the feasibility of surveys. Lower water levels correspond to easier survey
        conditions: steep slopes and thick vegetation make surveying challenging when the water is
        high. Surveys were periodically cancelled during years where high water made surveying
        difficult or during staffing shortages. Counts of red legged frog egg masses across all
        lakes ranged between 24 and 1778 in a given year.</para>
    </abstract>
    <keywordSet>
      <keyword>SPU</keyword>
      <keyword>City of Seattle</keyword>
      <keyword>King County</keyword>
      <keyword>Washington</keyword>
      <keyword>Cedar River Municipal Watershed (CRMW)</keyword>
      <keyword>Habitat Conservation Plan</keyword>
      <keyword>frogs</keyword>
      <keyword>Amphibian 14 Lakes</keyword>
    </keywordSet>
    <keywordSet>
      <keyword>Watershed Research and Monitoring</keyword>
      <keywordThesaurus>HCP Category</keywordThesaurus>
    </keywordSet>
    <keywordSet>
      <keyword>Watershed Terrestrial Monitoring and Research</keyword>
      <keywordThesaurus>HCP Group</keywordThesaurus>
    </keywordSet>
    <keywordSet>
      <keyword>lakes</keyword>
      <keyword>amphibians</keyword>
      <keywordThesaurus>LTER Controlled Vocabulary</keywordThesaurus>
    </keywordSet>
    <keywordSet>
      <keyword>Wildlife Species and Habitat Surveys</keyword>
      <keywordThesaurus>Project Name</keywordThesaurus>
    </keywordSet>
    <keywordSet>
      <keyword>Seattle Public Utilities</keyword>
      <keyword>Wildlife Research and Monitoring</keyword>
      <keywordThesaurus>SPU controlled vocabulary</keywordThesaurus>
    </keywordSet>
    <intellectualRights>
      <para>This information is released under the Creative Commons license - Attribution - CC BY
        (https://creativecommons.org/licenses/by/4.0/). The consumer of these data ("Data User"
        herein) is required to cite it appropriately in any publication that results from its use.
        The Data User should realize that these data may be actively used by others for ongoing
        research and that coordination may be necessary to prevent duplicate publication. The Data
        User is urged to contact the authors of these data if any questions about methodology or
        results occur. Where appropriate, the Data User is encouraged to consider collaboration or
        co-authorship with the authors. The Data User should realize that misinterpretation of data
        may occur if used out of context of the original study. While substantial efforts are made
        to ensure the accuracy of data and associated documentation, complete accuracy of data sets
        cannot be guaranteed. All data are made available "as is." The Data User should be aware,
        however, that data are updated periodically and it is the responsibility of the Data User to
        check for new versions of the data. The data authors and the repository where these data
        were obtained shall not be liable for damages resulting from any use or misinterpretation of
        the data. Thank you.</para>
    </intellectualRights>
    <licensed>
      <licenseName>Creative Commons Attribution 4.0 International</licenseName>
      <url>https://spdx.org/licenses/CC-BY-4.0</url>
      <identifier>CC-BY-4.0</identifier>
    </licensed>
    <distribution id="10.6073/pasta/9f0f6d9ac6d818e6774cbbad7964c1b7" scope="system"
      system="https://pasta.edirepository.org">
      <online>
        <url function="information"
          >https://doi.org/10.6073/pasta/9f0f6d9ac6d818e6774cbbad7964c1b7</url>
      </online>
    </distribution>
    <coverage>
      <geographicCoverage id="geo-1">
        <geographicDescription>A series of small lakes within the Cedar River Municipal Watershed in the Puget Sound region of western Washington State, USA</geographicDescription>
        <boundingCoordinates>
          <westBoundingCoordinate>-121.894046</westBoundingCoordinate>
          <eastBoundingCoordinate>-121.884546</eastBoundingCoordinate>
          <northBoundingCoordinate>47.3991</northBoundingCoordinate>
          <southBoundingCoordinate>47.396387</southBoundingCoordinate>
        </boundingCoordinates>
      </geographicCoverage>
      <temporalCoverage>
        <singleDateTime>
          <calendarDate>2002-03-28</calendarDate>
        </singleDateTime>
      </temporalCoverage>      
    </coverage>
    <maintenance>
      <description>
        <para>Data are collected annually around the last week of March, as time permits. Data
          package will be updated yearly in years where new data are collected.</para>
      </description>
      <maintenanceUpdateFrequency>annually</maintenanceUpdateFrequency>
    </maintenance>
    <contact>
      <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
      <address>
        <deliveryPoint>700 5th Avenue</deliveryPoint>
        <deliveryPoint>Suite 4900</deliveryPoint>
        <city>Seattle</city>
        <administrativeArea>WA</administrativeArea>
        <postalCode>98104</postalCode>
        <country>USA</country>
      </address>
      <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
      <onlineUrl>https://www.seattle.gov/utilites</onlineUrl>
      <userId directory="https://ror.org/">https://ror.org/05wkbzn97</userId>
    </contact>
    <publisher>
      <organizationName>Environmental Data Initiative</organizationName>
      <electronicMailAddress>info@edirepository.org</electronicMailAddress>
      <onlineUrl>https://edirepository.org</onlineUrl>
      <userId directory="https://ror.org">0330j0z60</userId>
    </publisher>
    <pubPlace>Environmental Data Initiative</pubPlace>
    <methods>
      <methodStep>
        <description>
          <para>Surveys are typically conducted during the last week of March or first week of April
            in fair weather that allows for counting egg masses beneath the water surface.</para>
        </description>
      </methodStep>
      <methodStep>
        <description>
          <para>Surveyors walk around the perimeter of the lake shore, counting every
            amphibian egg mass that they encounter. If amphibians in other life stages are
            encountered, the surveyor may also note them.</para>
        </description>
      </methodStep>
      <methodStep>
        <description>
          <para>Surveyors either walk around the lake shore, or wade around the lake shore,
            depending on the water depth of the lake (which fluctuates year-to-year), or the depth
            of the amphibian egg masses. Some years this can be very challenging when the water
            level is high enough due to dense vegetation and steep banks. High water levels caused
            surveyors to cancel the survey in some years.</para>
        </description>
      </methodStep>
      <methodStep>
        <description>
          <para>Depending on the water level, big lake and deep lake are either one continuous water
            body, or two distinct lakes. These were either counted together as one water body or
            distinctly as two water bodies depending on the surveyor, not whether or not they were a
            continuous water body during that year. Earlier surveys count these as two distinct
            lakes, and later surveys count these distinctly when they are separated, and as one lake
            when they are connected.</para>
        </description>
      </methodStep>
      <methodStep>
        <description>
          <para>In 2012 surveyors experimented with surveying a portion of the big lake and deep
            lake complex by snorkeling instead of walking to cope with the high water levels.</para>
        </description>
      </methodStep>
      <methodStep>
        <description>
          <para>Beginning in 2022 surveyors also surveyed select lakes via canoe to examine whether
            it was more effective for counting masses in deeper water. Surveyors continued to survey
            lakes on foot for comparison across years.</para>
        </description>
      </methodStep>
    </methods>
    <project>
      <title>Wildlife Species and Habitat Surveys</title>
      <personnel>
        <individualName>
          <givenName>Alexander</givenName>
          <surName>May</surName>
        </individualName>
        <organizationName>City of Seattle, Seattle Public Utilities</organizationName>
        <address>
          <deliveryPoint>19901 Cedar Falls Road SE</deliveryPoint>
          <city>North Bend</city>
          <administrativeArea>WA</administrativeArea>
          <postalCode>98045</postalCode>
          <country>USA</country>
        </address>
        <electronicMailAddress>SPU_EDI_Account_Managers@seattle.gov</electronicMailAddress>
        <onlineUrl>https://www.seattle.gov/utilities</onlineUrl>
        <userId directory="https://orcid.org">https://orcid.org/0000-0002-0013-1954</userId>
        <role>Project Manager</role>
      </personnel>
      <abstract>
        <para>The City of Seattle will fund selected species surveys, monitoring, or research
          projects (the particular species or species groups and project scopes to be determined),
          as needed to support the efficient and successful implementation of the Cedar River
          Watershed Habitat Conservation Plan with respect to its conservation objectives.</para>
      </abstract>
      <award>
        <funderName>City of Seattle</funderName>
        <awardNumber>N781311</awardNumber>
        <title>Wildlife Species and Habitat Surveys</title>
      </award>
      <award>
        <funderName>City of Seattle</funderName>
        <awardNumber>N000753</awardNumber>
        <title>Wildlife Species and Habitat Surveys</title>
      </award>
    </project>
    <dataTable id="24632bb8dbdace8be4693baf5c9e4b97" scope="document"
      system="https://pasta.edirepository.org">
      <entityName>SurveyResults</entityName>
      <entityDescription>Table contains survey information and the counts of the number of egg masses for each species during that survey.</entityDescription>
      <physical>
        <objectName>SurveyResults.csv</objectName>
        <size unit="byte">38958</size>
        <authentication method="MD5">e6433557c101fb97d71c08f9072489b8</authentication>
        <dataFormat>
          <textFormat>
            <numHeaderLines>1</numHeaderLines>
            <recordDelimiter>\n</recordDelimiter>
            <attributeOrientation>column</attributeOrientation>
            <simpleDelimited>
              <fieldDelimiter>,</fieldDelimiter>
              <quoteCharacter>"</quoteCharacter>
            </simpleDelimited>
          </textFormat>
        </dataFormat>
        <distribution>
          <online>
            <url function="download"
              >https://pasta.lternet.edu/package/data/eml/cos-spu/10/1/24632bb8dbdace8be4693baf5c9e4b97</url>
          </online>
        </distribution>
      </physical>
      <attributeList>
        <attribute id="cfe0601b-e76b-4f34-8a5a-655db3b0491c">
          <attributeName>SurveyID</attributeName>
          <attributeLabel>SurveyID</attributeLabel>
          <attributeDefinition>Unique ID based on date and lake surveyed</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="d49be2c0-7b9e-41f4-ae07-387d3e1f14c8">
          <attributeName>Latitude</attributeName>
          <attributeLabel>lat</attributeLabel>
          <attributeDefinition>Latitude of collection</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>degree</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Latitude not collected</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree">http://qudt.org/vocab/unit/DEG</valueURI>
          </annotation>
        </attribute>
        <attribute id="d2569832-42ec-4532-b333-bf68e84598da">
          <attributeName>Longitude</attributeName>
          <attributeLabel>long</attributeLabel>
          <attributeDefinition>longitude of collection</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>degree</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Longitude not collected</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree">http://qudt.org/vocab/unit/DEG</valueURI>
          </annotation>
        </attribute>
        <attribute id="81506c28-3ae9-473a-8426-70117c4a84ac">
          <attributeName>Accuracy_m</attributeName>
          <attributeLabel>accuracy_m</attributeLabel>
          <attributeDefinition>GPS positional accuracy in meters, as reported by iphone data collection app</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>meter</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>GPS positional accuracy information not available, or not applicable</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Meter">http://qudt.org/vocab/unit/M</valueURI>
          </annotation>
        </attribute>
        <attribute id="6778d3cd-77e3-4b7b-9844-31248310479d">
          <attributeName>Date</attributeName>
          <attributeLabel>Date</attributeLabel>
          <attributeDefinition>sampling date. If the sampling date is March 1st of any given year, this is a placeholder date for a survey year where no survey date was recorded.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">dateTime</storageType>
          <measurementScale>
            <dateTime>
              <formatString>YYYY-MM-DD</formatString>
              <dateTimeDomain/>
            </dateTime>
          </measurementScale>
          <missingValueCode>
            <code>XXXX-03-01</code>
            <codeExplanation>placeholder date for a survey year where no survey date was recorded</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="6464d56e-8a40-4962-ae4c-1cbc7795250e">
          <attributeName>StartTime</attributeName>
          <attributeLabel>StartTime</attributeLabel>
          <attributeDefinition>Start time of survey in Pacific Time (America/LosAngeles), with appropriate daylight savings adjustment, if applicable</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">dateTime</storageType>
          <measurementScale>
            <dateTime>
              <formatString>hh:mm:ss</formatString>
              <dateTimeDomain/>
            </dateTime>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Start time data not collected</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="be22b649-5e4e-43bd-ad37-1965f3d23bdc">
          <attributeName>EndTime</attributeName>
          <attributeLabel>EndTime</attributeLabel>
          <attributeDefinition>End time of survey in Pacific Time (America/LosAngeles), with appropriate daylight savings adjustment, if applicable</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">dateTime</storageType>
          <measurementScale>
            <dateTime>
              <formatString>hh:mm:ss</formatString>
              <dateTimeDomain/>
            </dateTime>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>End time data not collected</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="3132391c-2f62-4aac-a208-549c2cbff735">
          <attributeName>SurveyLength</attributeName>
          <attributeLabel>SurveyLength</attributeLabel>
          <attributeDefinition>Total time spent on survey (HH:MM)</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="e58a1ac7-066f-45f9-a4b8-9b596c60eb07">
          <attributeName>SurveyLengthCalc</attributeName>
          <attributeLabel>SurveyLengthCalc</attributeLabel>
          <attributeDefinition>Total time spent on survey (HH:MM), estimated when end time was not recorded, based off of the last observation time during that survey.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="f31e76c5-3359-4b21-af25-9e09634ab47f">
          <attributeName>latest_observation_time</attributeName>
          <attributeLabel>latest_observation_time</attributeLabel>
          <attributeDefinition>The final egg mass detection time in a survey-used for SurveyLengthCalc.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="66c5e93d-7a8b-4dbf-989f-9294db3ec7b9">
          <attributeName>Lake</attributeName>
          <attributeLabel>Lake</attributeLabel>
          <attributeDefinition>Lake surveyed. Big Lake and Deep Lake form one continuous waterbody during high water years, and from 2021 to 2022 it was surveyed as one lake as opposed to breaking the lake up into two surveys. See map jpg for lake name labels.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="398be849-a3d4-4c61-9013-ae41cb6d6d59">
          <attributeName>Observer</attributeName>
          <attributeLabel>Observer</attributeLabel>
          <attributeDefinition>Last name, or first and last name, of surveyor(s)</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="88da6649-63cf-4b6f-a3c8-6a37a6155833">
          <attributeName>Sky</attributeName>
          <attributeLabel>Sky</attributeLabel>
          <attributeDefinition>Cloud cover characteristics at the start of the survey. Egg masses are easier to see in clear and sunny conditions compared to overcast and cloudy conditions.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="56fb8aad-a34a-4ebb-9175-bf80b2f6840f">
          <attributeName>Precip</attributeName>
          <attributeLabel>Precip</attributeLabel>
          <attributeDefinition>Precipitation at the survey start. Rain disturbs the water surface and makes egg masses difficult to see.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NULL</code>
            <codeExplanation>Historic data that predated this specific column, or observer did not note precipitation conditions</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="3357918a-e3b9-4829-97cc-f44b1aa6b51e">
          <attributeName>Wind</attributeName>
          <attributeLabel>Wind</attributeLabel>
          <attributeDefinition>General description of wind at start of survey. Wind disturbs the water surface and makes egg masses harder to see.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NULL</code>
            <codeExplanation>Didn't measure wind speed</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="71c4f9e8-5448-4d5b-859a-1b6b6bc2dd46">
          <attributeName>AirThermometer</attributeName>
          <attributeLabel>AirThermometer</attributeLabel>
          <attributeDefinition>Check if a thermometer was used to measure air temperature in the field.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="yes">
                  <codeDefinition>
                    <code>No</code>
                    <definition>Observer did not have an air thermometer with them, so temperature may be based on weather forecast</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>Yes</code>
                    <definition>Observer used a thermometer to measure local air temperature conditions</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Historic data that predated this specific column, or observer did not note whether they had an air thermometer</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="0673eb41-1b47-4d32-9d87-bf10e17c69b6">
          <attributeName>AirTemperature_F</attributeName>
          <attributeLabel>AirTemperature_F</attributeLabel>
          <attributeDefinition>Air temperature measured at the start of the survey (if airthermometer=Yes), or from cell phone weather app</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>fahrenheit</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Observer did not report air temperature</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree Fahrenheit">http://qudt.org/vocab/unit/DEG_F</valueURI>
          </annotation>
        </attribute>
        <attribute id="0ade98ad-add4-4ce5-afcb-6c703b12cf1e">
          <attributeName>WaterThermometer</attributeName>
          <attributeLabel>WaterThermometer</attributeLabel>
          <attributeDefinition>Check if a thermometer was used to measure water temperature in the field.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="yes">
                  <codeDefinition>
                    <code>No</code>
                    <definition>Observer did not have a water thermometer with them</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>Yes</code>
                    <definition>Observer had a water thermometer with them</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Historic data that predated this specific column, or observer did not note whether they had a water thermometer</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="dca8c4a4-472b-4998-bf35-82b9e4fb8f22">
          <attributeName>WaterTemperature_F</attributeName>
          <attributeLabel>WaterTemperature_F</attributeLabel>
          <attributeDefinition>Water temperature measured at the start of the survey at 6 inch depth, in the shade if possible.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>fahrenheit</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Observer did not report water temperature</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree Fahrenheit">http://qudt.org/vocab/unit/DEG_F</valueURI>
          </annotation>
        </attribute>
        <attribute id="7713a0b2-d5b2-4378-8d6d-6c74baae6971">
          <attributeName>WaterColor</attributeName>
          <attributeLabel>WaterColor</attributeLabel>
          <attributeDefinition>Color of the lake water (clear, or stained from tannins). Egg masses slightly harder to discern in stained water.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="yes">
                  <codeDefinition>
                    <code>nan</code>
                    <definition>WaterColor data not recorded</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>Clear</code>
                    <definition>Color of water not discernable. Apparently clear or colorless.</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>Stained</code>
                    <definition>Water appears stained by tannins, with greenish or brownish hue.</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Water color data not collected</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="62090101-5cc1-463c-a63d-843616d148cb">
          <attributeName>SurveyType</attributeName>
          <attributeLabel>SurveyType</attributeLabel>
          <attributeDefinition>Conveyance method for the survey.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="yes">
                  <codeDefinition>
                    <code>Canoe Survey</code>
                    <definition>Focued on RAAU counts-any other detections are incidental. Counts conducted by canoe, allowing detection of egg masses not visible from shore. Individual egg mass detections not always recorded.</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>wading</code>
                    <definition>Surveys conducted in-and-out of the water, wearing chest or waist waders. Often within 5-6' of shoreline, depending on topography.</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>walk</code>
                    <definition>Surveys conducted by walking the perimeter of the lake outside the water.</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Typical of historic data, where all survey types presumed to be walk or wade, with the exception of the singular snorkel survey</codeExplanation>
          </missingValueCode>
        </attribute>
        <attribute id="0c944fd1-915e-40fb-82f1-b2da8a5da74e">
          <attributeName>Comments</attributeName>
          <attributeLabel>Comments</attributeLabel>
          <attributeDefinition>Freeform comments about the survey</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="24b4badd-56b7-4dbf-8848-f6531f20c024">
          <attributeName>SpeciesCode</attributeName>
          <attributeLabel>species</attributeLabel>
          <attributeDefinition>Species code identifier for the NumberOf... columns</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="no">
                  <codeDefinition>
                    <code>AMGR</code>
                    <definition>Ambystoma gracile</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>AMMA</code>
                    <definition>Ambystoma macrodactylum</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>PSRE</code>
                    <definition>Pseudacris regilla</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>RAAU</code>
                    <definition>Rana aurora</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>TAGR</code>
                    <definition>Taricha granulosa</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="60ffc8a2-c42f-40ab-89fa-db294f256e50">
          <attributeName>NumberOfEggMasses</attributeName>
          <attributeLabel>NumberOfEggMasses</attributeLabel>
          <attributeDefinition>Number of egg masses counted per species during a survey</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>number</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Egg masses for that species were not specifically counted on that survey, or no survey was conducted</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Number">http://qudt.org/vocab/unit/NUM</valueURI>
          </annotation>
        </attribute>
        <attribute id="6630e2e6-ed6e-4d50-8fdb-b9eff7e905cf">
          <attributeName>NumberOfAdults</attributeName>
          <attributeLabel>NumberOfAdults</attributeLabel>
          <attributeDefinition>Number of adults counted per species during a survey</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>number</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>No adult data collected. An NA does not indicate there were no adults present.</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Number">http://qudt.org/vocab/unit/NUM</valueURI>
          </annotation>
        </attribute>
        <attribute id="4403ca82-f7e0-48c8-8cef-ca07017f4d2b">
          <attributeName>Weather</attributeName>
          <attributeLabel>Weather</attributeLabel>
          <attributeDefinition>longform description of weather conditions</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
      </attributeList>
      <caseSensitive>no</caseSensitive>
      <numberOfRecords>240</numberOfRecords>
    </dataTable>
    <dataTable id="9f81741eef929975361d53fe07d370b9" scope="document"
      system="https://pasta.edirepository.org">
      <entityName>EggMasses</entityName>
      <entityDescription>Contains fine-scale information on groups of egg masses encountered during a survey, including GPS data. These data were only collected from 2021 onward, and were not collected for every survey--SurveyResults has the authoritative counts of egg masses for each survey.</entityDescription>
      <physical>
        <objectName>EggMasses.csv</objectName>
        <size unit="byte">66941</size>
        <authentication method="MD5">37c3e8517ed84ad2d0505a9ee9dc393f</authentication>
        <dataFormat>
          <textFormat>
            <numHeaderLines>1</numHeaderLines>
            <recordDelimiter>\n</recordDelimiter>
            <attributeOrientation>column</attributeOrientation>
            <simpleDelimited>
              <fieldDelimiter>,</fieldDelimiter>
              <quoteCharacter>"</quoteCharacter>
            </simpleDelimited>
          </textFormat>
        </dataFormat>
        <distribution>
          <online>
            <url function="download"
              >https://pasta.lternet.edu/package/data/eml/cos-spu/10/1/9f81741eef929975361d53fe07d370b9</url>
          </online>
        </distribution>
      </physical>
      <attributeList>
        <attribute id="8a90023e-72cc-4540-a4b2-d4532ea86c38">
          <attributeName>SurveyID</attributeName>
          <attributeLabel>SurveyID</attributeLabel>
          <attributeDefinition>Unique ID based on date and lake surveyed</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="c36d17e7-89b2-4722-b586-49d9934a398e">
          <attributeName>DateTime</attributeName>
          <attributeLabel>DateTime</attributeLabel>
          <attributeDefinition>Date and time of observation of egg mass(es). America/LosAngeles time zone.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">dateTime</storageType>
          <measurementScale>
            <dateTime>
              <formatString>YYYY-MM-DD hh:mm:ss</formatString>
              <dateTimeDomain/>
            </dateTime>
          </measurementScale>
        </attribute>
        <attribute id="2a325933-956f-485f-b0be-2817f7b7462c">
          <attributeName>Latitude</attributeName>
          <attributeLabel>Latitude</attributeLabel>
          <attributeDefinition>Latitude of observation (WGS84)</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>degree</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Latitude not collected</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree">http://qudt.org/vocab/unit/DEG</valueURI>
          </annotation>
        </attribute>
        <attribute id="d9a40fb9-4210-4527-9f4f-219c3583ef1c">
          <attributeName>Longitude</attributeName>
          <attributeLabel>Longitude</attributeLabel>
          <attributeDefinition>Longitude of observation (WGS84</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>degree</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Longitude not collected</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Degree">http://qudt.org/vocab/unit/DEG</valueURI>
          </annotation>
        </attribute>
        <attribute id="1e536558-938d-45a8-b83d-5d178cfd7d18">
          <attributeName>Accuracy_m</attributeName>
          <attributeLabel>Loc_Accuracy</attributeLabel>
          <attributeDefinition>Estimated GPS precision</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>meter</standardUnit>
              </unit>
              <numericDomain>
                <numberType>real</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <missingValueCode>
            <code>NA</code>
            <codeExplanation>Latitude and longitude not collected, so no GPS accuracy information</codeExplanation>
          </missingValueCode>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Meter">http://qudt.org/vocab/unit/M</valueURI>
          </annotation>
        </attribute>
        <attribute id="85b6fa31-21ce-4e3a-a8f7-404c669a9cc7">
          <attributeName>NumberOfEggMasses</attributeName>
          <attributeLabel>NumberOfEggMasses</attributeLabel>
          <attributeDefinition>The number of egg masses counted in a given observation. Nearby egg masses of the same species and on the same substrate were grouped together in one observation to speed data entry. Those egg masses were often within a couple meters of each other.</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">float</storageType>
          <measurementScale>
            <ratio>
              <unit>
                <standardUnit>number</standardUnit>
              </unit>
              <numericDomain>
                <numberType>integer</numberType>
              </numericDomain>
            </ratio>
          </measurementScale>
          <annotation>
            <propertyURI label="has unit">http://qudt.org/schema/qudt/hasUnit</propertyURI>
            <valueURI label="Number">http://qudt.org/vocab/unit/NUM</valueURI>
          </annotation>
        </attribute>
        <attribute id="f838b7b8-2468-47bd-9717-56ea091e4780">
          <attributeName>SpeciesCode</attributeName>
          <attributeLabel>Species</attributeLabel>
          <attributeDefinition>Amphibian species of the egg mass observation</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <enumeratedDomain enforced="no">
                  <codeDefinition>
                    <code>AMGR</code>
                    <definition>Ambystoma gracile</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>AMMA</code>
                    <definition>Ambystoma macrodactylum</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>PSRE</code>
                    <definition>Pseudacris regilla</definition>
                  </codeDefinition>
                  <codeDefinition>
                    <code>RAAU</code>
                    <definition>Rana aurora</definition>
                  </codeDefinition>
                </enumeratedDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="3220828d-a9a3-4c98-89a6-36f4a740a57e">
          <attributeName>EggMassSubstrate</attributeName>
          <attributeLabel>EggMassSubstrate</attributeLabel>
          <attributeDefinition>What the egg mass was attached to</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
        <attribute id="8854db34-3d6e-481a-81d4-a73a6b3eb8b1">
          <attributeName>Comments</attributeName>
          <attributeLabel>Comments</attributeLabel>
          <attributeDefinition>comments about the observation</attributeDefinition>
          <storageType typeSystem="XML Schema Datatypes">string</storageType>
          <measurementScale>
            <nominal>
              <nonNumericDomain>
                <textDomain>
                  <definition>text</definition>
                </textDomain>
              </nonNumericDomain>
            </nominal>
          </measurementScale>
        </attribute>
      </attributeList>
      <caseSensitive>no</caseSensitive>
      <numberOfRecords>686</numberOfRecords>
    </dataTable>
    <otherEntity id="befe3d845aea4510048251bd0079e3de" scope="document"
      system="https://pasta.edirepository.org">
      <entityName>14LakesRiparianHabitatRestorationProjectAsBuilt2012</entityName>
      <entityDescription>14 Lakes Riparian Habitat Restoration Project As-Built Document referenced in SurveyReport_2003_2014 amphibian monitoring survey report. Provided for greater context regarding habitat management in the project location.</entityDescription>
      <physical>
        <objectName>14LakesRiparianHabitatRestorationProjectAsBuilt2012.pdf</objectName>
        <size unit="byte">319135</size>
        <authentication method="MD5">d2f659d3fae529f1b7e3009cd175db09</authentication>
        <dataFormat>
          <externallyDefinedFormat>
            <formatName>application/pdf</formatName>
          </externallyDefinedFormat>
        </dataFormat>
        <distribution>
          <online>
            <url function="download"
              >https://pasta.lternet.edu/package/data/eml/cos-spu/10/1/befe3d845aea4510048251bd0079e3de</url>
          </online>
        </distribution>
      </physical>
      <entityType>application/pdf</entityType>
    </otherEntity>
  </dataset>
  <additionalMetadata>
    <metadata>
      <stmml:unitList>
        <stmml:unit id="bytes" name="bytes">
          <stmml:description/>
        </stmml:unit>
        <stmml:unit id="ISO" name="ISO">
          <stmml:description/>
        </stmml:unit>
      </stmml:unitList>
    </metadata>
  </additionalMetadata>
  <additionalMetadata>
    <metadata>
      <emlEditor app="ezEML" release="2025.09.10"/>
    </metadata>
  </additionalMetadata>
</eml:eml>`;

export const MOCK_RECOMMENDATIONS: { id: string, recommendations: OntologyTerm[] }[] = [
  // SurveyResults DataTable
  {
    id: "24632bb8dbdace8be4693baf5c9e4b97",
    recommendations: [
      { label: "Survey Dataset", uri: "http://purl.obolibrary.org/obo/IAO_0000100", ontology: "IAO", confidence: 0.90, description: "A data set that is a collection of data about a survey.", propertyLabel: "contains", propertyUri: "http://www.w3.org/ns/oa#hasBody" }
    ]
  },
  // SurveyID
  {
    id: "cfe0601b-e76b-4f34-8a5a-655db3b0491c",
    recommendations: [
      { 
        label: "Identifier", 
        uri: "http://purl.obolibrary.org/obo/IAO_0000578", 
        ontology: "IAO", 
        confidence: 0.95, 
        description: "An information content entity that identifies something.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "SurveyID",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // Latitude
  {
    id: "d49be2c0-7b9e-41f4-ae07-387d3e1f14c8",
    recommendations: [
      { 
        label: "Latitude", 
        uri: "http://purl.obolibrary.org/obo/GEO_00000016", 
        ontology: "GEO", 
        confidence: 0.99, 
        description: "The angular distance of a place north or south of the earth's equator.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "Latitude",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // AirTemperature_F
  {
    id: "0673eb41-1b47-4d32-9d87-bf10e17c69b6",
    recommendations: [
      { 
        label: "Air Temperature", 
        uri: "http://purl.obolibrary.org/obo/ENVO_00002006", 
        ontology: "ENVO", 
        confidence: 0.90, 
        description: "The temperature of the air.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "AirTemperature_F",
        objectName: "SurveyResults.csv"
      },
      { 
        label: "Temperature", 
        uri: "http://purl.obolibrary.org/obo/PATO_0000146", 
        ontology: "PATO", 
        confidence: 0.85, 
        description: "A physical quality of the thermal energy of a system.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "AirTemperature_F",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // WaterTemperature_F
  {
    id: "dca8c4a4-472b-4998-bf35-82b9e4fb8f22",
    recommendations: [
      { 
        label: "Water Temperature", 
        uri: "http://purl.obolibrary.org/obo/ENVO_00002010", 
        ontology: "ENVO", 
        confidence: 0.95, 
        description: "The temperature of water.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "WaterTemperature_F",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // Lake
  {
    id: "66c5e93d-7a8b-4dbf-989f-9294db3ec7b9",
    recommendations: [
      { 
        label: "Lake", 
        uri: "http://purl.obolibrary.org/obo/ENVO_00000020", 
        ontology: "ENVO", 
        confidence: 0.92, 
        description: "A large body of water surrounded by land.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "Lake",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // SpeciesCode
  {
    id: "24b4badd-56b7-4dbf-8848-f6531f20c024",
    recommendations: [
      { 
        label: "Taxon", 
        uri: "http://rs.tdwg.org/dwc/terms/Taxon", 
        ontology: "DWC", 
        confidence: 0.88, 
        description: "A group of one or more populations of an organism.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "SpeciesCode",
        objectName: "SurveyResults.csv"
      },
      { 
        label: "Scientific Name", 
        uri: "http://rs.tdwg.org/dwc/terms/scientificName", 
        ontology: "DWC", 
        confidence: 0.80, 
        description: "The full scientific name.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "SpeciesCode",
        objectName: "SurveyResults.csv"
      }
    ]
  },
  // EggMassSubstrate (from second table)
  {
    id: "3220828d-a9a3-4c98-89a6-36f4a740a57e",
    recommendations: [
      { 
        label: "Surface Layer", 
        uri: "http://purl.obolibrary.org/obo/ENVO_00002005", 
        ontology: "ENVO", 
        confidence: 0.70, 
        description: "The layer of a material that is in contact with the surrounding medium.", 
        propertyLabel: "contains measurements of type", 
        propertyUri: "http://ecoinformatics.org/oboe/oboe.1.2/oboe-core.owl#containsMeasurementsOfType",
        attributeName: "EggMassSubstrate",
        objectName: "EggMasses.csv"
      }
    ]
  },
  // Geo Coverage
  {
    id: "geo-1",
    recommendations: [
       { label: "Freshwater Lake Ecosystem", uri: "http://purl.obolibrary.org/obo/ENVO_01000021", ontology: "ENVO", confidence: 0.75, description: "An aquatic ecosystem that is part of a lake.", propertyLabel: "contains", propertyUri: "http://www.w3.org/ns/oa#hasBody" }
    ]
  },
  // Other Entity
  {
    id: "befe3d845aea4510048251bd0079e3de",
    recommendations: [
      { label: "Technical Report", uri: "http://purl.obolibrary.org/obo/IAO_0000088", ontology: "IAO", confidence: 0.85, description: "A report concerning the results of a scientific investigation or technical development.", propertyLabel: "contains", propertyUri: "http://www.w3.org/ns/oa#hasBody" }
    ]
  }
];