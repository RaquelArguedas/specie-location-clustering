from pygbif import occurrences
import pandas as pd


df = pd.DataFrame()
total_occurrences = 10200
batch_size = 300
for i in range(0, total_occurrences, batch_size):
    print('i: ', i)
    res = occurrences.search(offset=i, hasCoordinate=True, continent="EUROPE", kingdomKey=1, classKey=212, mediatype='StillImage')
    temp_df = pd.DataFrame(res['results'])
    if temp_df.empty:
        break

    columns = ['gbifID', 'sex', 'lifeStage', 'occurrenceStatus', 'occurrenceRemarks', 'eventDate',
            'year', 'month', 'day', 'continent', 'countryCode', 'stateProvince', 'decimalLatitude',
            'decimalLongitude', 'coordinateUncertaintyInMeters', 'identificationID', 'taxonID',
            'scientificName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'genericName',
            'specificEpithet', 'taxonRank', 'media']

    temp_df = temp_df[columns]
    temp_df = temp_df[temp_df['decimalLatitude'].notnull() & temp_df['decimalLongitude'].notnull() & temp_df['scientificName'].notnull()]

    col = []
    for index, item in temp_df.iterrows():
        col += [(item.to_dict())['media'][0]['identifier']]
    temp_df['media'] = col

    df = pd.concat([df, temp_df], ignore_index=True)

print(df.head())
print()
print(len(df))

print('amount of species', len(df['scientificName'].unique()))