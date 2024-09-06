import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
import h3
import os

# Goes throw downloaded datasets to make one. Returns that one last dataset.
def get_datasets():
    df = pd.DataFrame()
    multi_df = pd.DataFrame()
    for name in os.listdir('C:/Users/raque/OneDrive - Estudiantes ITCR/Raquel/TEC/2024 II Semestre/CoCoProject/specie-location-clustering/originalDatasets'):
        temp_df = pd.read_csv(f'originalDatasets/{name}', delimiter='\t', low_memory=False)
        if name.startswith('occurrence'):
            df = pd.concat([df, temp_df], ignore_index=True)
        else:
            multi_df = pd.concat([multi_df, temp_df], ignore_index=True)
    return df, multi_df

# Print info about each column
def get_columns_info(df):
    for column in df.columns:
        column_name = column
        column_type = df[column].dtype
        null_count = df[column].isnull().sum()
        print(f"Column Name: {column_name}, Type: {column_type}, Null Counts: {null_count} of {len(df)}")

# Returns true or false if there is a full null column
def any_null_column(df):
    for column in df.columns:
        if (df[column].isnull().sum() == len(df)):
            return True
    return False

# Returns true or false if there are repeated cells
def are_repeated(df, column_name):
    col = df[column_name].tolist()
    return len(col) != len(set(col))

def get_multi_dict(multi_df):
    multi_dict = []
    images_ids = multi_df['gbifID'].tolist()
    images = multi_df['identifier'].tolist()

    for i in range(len(images_ids)):
        arr = []
        for j in range(len(images_ids)):           
            if (images_ids[i] == images_ids[j]):
                arr += [images[j]]

        new_item = [images_ids[i], arr]
        add = True if len(multi_dict) == 0 else (not(new_item == multi_dict[-1]))
        if (add):
            multi_dict += [new_item]
    return multi_dict

# Add multimedia link based on the gbifID
def add_multi(df, multi_df):
    col = np.empty(df.shape[0], dtype=object)
    col[:] = [[] for _ in range(df.shape[0])]
    
    ids = df['gbifID'].tolist()
    multi_dict = get_multi_dict(multi_df)

    for i in range(len(ids)):
        print (f"{i} out of {len(ids)}", end="\r", flush=True)
        for item in multi_dict:
            if (item[0] == ids[i]):
                col[i] = item

    df['identifier'] = col;

# Add hexagon columns
def add_hexagons(df):
    col = []
    for index, item in df.iterrows():
        print (f"{index} out of {len(df)}", end="\r")
        cell = h3.latlng_to_cell(item['decimalLatitude'], item['decimalLongitude'], 1)
        col += [cell]
    df['hexagon'] = col

def unique_values(list):
    result = []
    for target in list:
        if not target in result: 
            result += [target]
    return result


def get_correlation_table(df, header):
    species = unique_values(df['scientificName'].tolist())

    # add rows empty cells
    table = [header]
    for specie in species:
        table += [[specie] + ([0] * (len(header)-1))] 

    # fill the table
    for country_index in range(1, len(table[0])):
        for specie_index in range(1, len(table)):
            temp = df[(df['hexagon']==table[0][country_index]) & (df['scientificName']==table[specie_index][0])]
            table[specie_index][country_index] = len(temp)
    
    return table

def standarize(df):
    columns = df.columns[1:]
    df = df[columns]
    df = MinMaxScaler().fit_transform(df[columns])
    df = pd.DataFrame(data=df, columns=columns)
    return df

def get_best_k(df, columns):
    bestK = 2
    maxSil = -2
    for k in range(2, 11):
        print('k: ', k)
        kmeans = KMeans(n_clusters = k).fit(df[columns])
        labels = kmeans.labels_
        result = silhouette_score(df[columns], labels, metric = 'euclidean')
        if result > maxSil:
            maxSil = result 
            bestK = k
    return bestK

def do_clustering(df):
    columns = df.columns[1:]
    df = df[columns]
    k = get_best_k(df, columns)
    print('After k')
    km = KMeans(n_clusters=k) 
    print('Clustering done')
    y2 = km.fit_predict(df[columns]) 
    print('Row done')
    return y2

# visualize
def visualize(df):
    plt.figure(figsize=(10, 8))
    plt.scatter(df.iloc[:, 0], df.iloc[:, 1], c=df['cluster'], cmap='inferno', s=50, alpha=0.7)
    plt.colorbar(label='Clases')
    plt.show()

def main():
    print('Starting...')
    df, multi_df = get_datasets()
    print('Datasets obtained')

    # reduce to desired columns
    multi_df = multi_df[['gbifID', 'identifier']]
    df = df[['gbifID', 'sex', 'lifeStage', 'occurrenceStatus', 'occurrenceRemarks', 'eventDate', 
            'year', 'month', 'day', 'continent', 'countryCode', 'stateProvince', 'decimalLatitude', 
            'decimalLongitude', 'coordinateUncertaintyInMeters', 'identificationID', 'taxonID', 
            'scientificName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'genericName', 
            'specificEpithet', 'taxonRank']]

    # not null values in those columns
    df = df[df['decimalLatitude'].notnull() & df['decimalLongitude'].notnull() & df['scientificName'].notnull()]

    print('Columns and rows reduced, dataset info:', df.info())

    print('Adding multi column...')
    add_multi(df, multi_df)
    print('Adding hexagons column...')
    add_hexagons(df)

    print('Other columns added')

    correlation_columns = unique_values(['scientificName'] + df['hexagon'].tolist())
    correlation_df = pd.DataFrame(get_correlation_table(df, correlation_columns)[1:])
    correlation_df.columns = correlation_columns
    # print(correlation_df) # table with occurences region specie relation
    print('Table done, creating csv...')
    correlation_df.to_csv(os.path.join(os.getcwd(), 'correlation_table.csv'))

    correlation_df = standarize(correlation_df)
    # print(correlation_df) # standarize table
    print('Creating second csv...')
    correlation_df.to_csv(os.path.join(os.getcwd(), 'normalize_correlation_table.csv'))


    # Need to debug
    # print('Doing cluster...')
    # correlation_df['cluster'] = do_clustering(correlation_df)
    # print(correlation_df.head())

    print('Done')
    
main()
