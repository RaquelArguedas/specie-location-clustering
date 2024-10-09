import matplotlib.pyplot as plt
import pandas as pd
import os
import ast
import h3
from shared.gbif_connection import get_datasets

# Delete rows with less than 100 occurrences
def filter_rows_by_sum(correlation_df, threshold):
    row_sums = correlation_df.iloc[:, 1:].sum(axis=1)
    filtered_df = correlation_df[row_sums >= threshold]
    return filtered_df

# Delete columns with less than 100 occurrences
def filter_columns_by_sum(correlation_df, threshold):
    column_sums = correlation_df.iloc[:, 1:].sum(axis=0)
    filtered_df = correlation_df.loc[:, correlation_df.columns[1:][column_sums >= threshold]]
    filtered_df = pd.concat([correlation_df.iloc[:, 0], filtered_df], axis=1)
    return filtered_df

# Add hexagon columns
def add_hexagons(df):
    col = []
    for index, item in df.iterrows():
        cell = h3.latlng_to_cell(item['decimalLatitude'], item['decimalLongitude'], 1)
        col += [cell]
    df['hexagon'] = col

# Obtaing cleaned df 
def obtain_df(df_cache):
    print('Starting...')
    if df_cache is not None:
        return df_cache
     
    if not os.path.exists('biodataset.csv'): 
        df = get_datasets()
        df.to_csv('biodataset.csv', index=False) 
    else: 
        df = pd.read_csv('biodataset.csv') # ! Works
    print('Datasets obtained')

    df = df[['gbifID', 'sex', 'lifeStage', 'occurrenceStatus', 'occurrenceRemarks', 'eventDate', 
            'year', 'month', 'day', 'continent', 'countryCode', 'stateProvince', 'decimalLatitude', 
            'decimalLongitude', 'coordinateUncertaintyInMeters', 'identificationID', 'taxonID', 
            'scientificName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'genericName', 
            'specificEpithet', 'taxonRank', 'media']]
    col = []

    for index, item in df.iterrows():
        media_list = item.to_dict()['media']
        if isinstance(media_list, str):
            col += [ast.literal_eval(media_list)[0]['identifier']]
        else:
            col += [media_list[0]['identifier']]

    df['media'] = col
    
    # not null values in those columns
    df = df[df['decimalLatitude'].notnull() & df['decimalLongitude'].notnull() & df['scientificName'].notnull()]
    print('Columns and rows reduced')

    print('Adding hexagons column...')
    add_hexagons(df)

    return df


# Auxiliar functions that help to get some info, not escencial 
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

# visualize
def visualize(df, x_col, y_col, cluster_col):
    plt.figure(figsize=(10, 8))
    
    # Crear el scatter plot usando las columnas indicadas
    plt.scatter(df[x_col], df[y_col], c=df[cluster_col], cmap='inferno', s=50, alpha=0.7)
    
    # Etiquetas y colorbar
    plt.xlabel(x_col)
    plt.ylabel(y_col)
    plt.colorbar(label='Clusters')
    
    plt.title('Clustering Visualization')
    plt.show()

    