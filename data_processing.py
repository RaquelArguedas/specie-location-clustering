import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import umap
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
import os

# Goes throw downloaded datasets to make one. Returns that one last dataset.
def get_datasets():
    df = pd.DataFrame()
    multi_df = pd.DataFrame()
    for name in os.listdir('C:/Users/raque/OneDrive - Estudiantes ITCR/Raquel/TEC/2024 II Semestre/CoCoProject/specie-location-clustering/originalDatasets'):
        temp_df = pd.read_csv(f'originalDatasets/{name}', delimiter='\t')
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

# Returns true or false if there is a full null column
def any_null_column(df):
    for column in df.columns:
        if (df[column].isnull().sum() == len(df)):
            return True
    return False

# Returns true or false if there are repeated ids
def double_id(df):
    col = df['gbifID'].tolist()
    return len(col) != len(set(col))



def main():
    df, multi_df = get_datasets()

    # reduce to desired columns
    multi_df = multi_df[['gbifID', 'identifier']]
    df = df[['gbifID', 'sex', 'lifeStage', 'occurrenceStatus', 'occurrenceRemarks', 'eventDate', 
            'year', 'month', 'day', 'continent', 'countryCode', 'stateProvince', 'decimalLatitude', 
            'decimalLongitude', 'coordinateUncertaintyInMeters', 'identificationID', 'taxonID', 
            'scientificName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'genericName', 
            'specificEpithet', 'taxonRank']]

    print('len(multi_df)',len(multi_df)) 
    print('len(df)',len(df))

    print('double_id(multi_df)', double_id(multi_df))
    print('double_id(df)', double_id(df))

main()






# Add multimedia link based on the gbifID
# df['identifier'] = np.full(shape=df.shape[0], fill_value=None)
# for i in range(0, df.shape[0]):
#     gbifID_value = df.iloc[i]['gbifID']
#     target = multi_df.loc[multi_df['gbifID'] == gbifID_value]
#     if (target.size != 0):
#         df.loc[df.index[i], 'identifier'] = target['identifier'].values[0]

# Mostrar las primeras filas del DataFrame y las columnas
# print(df.columns)
# print(df.head())
# print('___________________________')
# print(multi_df.columns)
# print(multi_df.head())
# print('___________________________')




# columns = ['individualCount','decimalLatitude','decimalLongitude','depth','taxonKey',
#             'kingdomKey','phylumKey','familyKey','genusKey']

# occur_df = pd.read_csv('occurrence.txt', delimiter='\t', low_memory=False)
# occur_df = occur_df[['gbifID',     
#                     'individualCount',
#                     # 'organismQuantity', #commented because too many nulls
#                     'decimalLatitude',
#                     'decimalLongitude',
#                     'depth',
#                     'taxonKey',
#                     'kingdomKey',    
#                     'phylumKey',   
#                     'familyKey',   
#                     'genusKey']]
# occur_df = occur_df.dropna() # no null data

# multimedia_df = pd.read_csv('multimedia.txt', delimiter='\t')
# multimedia_df = multimedia_df[['gbifID', 'identifier']]
# multimedia_df = multimedia_df.dropna()

# # Add multimedia link based on the ID
# occur_df['identifier'] = np.full(shape=occur_df.shape[0], fill_value=None)
# for i in range(0, occur_df.shape[0]):
#     gbifID_value = occur_df.iloc[i]['gbifID']
#     target = multimedia_df.loc[multimedia_df['gbifID'] == gbifID_value]
#     if (target.size != 0):
#         occur_df.loc[occur_df.index[i], 'identifier'] = target['identifier'].values[0]

# df = occur_df[columns];

# #! standarize
# df = StandardScaler().fit_transform(df)
# df = pd.DataFrame(data=df, columns=columns)
# X2 = df.to_numpy()

# #! predict
# bestK = 2
# maxSil = -2
# for k in range(2, 11):
#   kmeans = KMeans(n_clusters = k).fit(df[columns])
#   labels = kmeans.labels_
#   result = silhouette_score(df[columns], labels, metric = 'euclidean')
#   if result > maxSil:
#      maxSil = result 
#      bestK = k

# km = KMeans(n_clusters=k) 
# y2 = km.fit_predict(df[columns]) 

# # ! UMAP adjustment
# umap_model = umap.UMAP(n_components=2, random_state=42)
# X_umap = umap_model.fit_transform(X2) 

# # Visualize
# plt.figure(figsize=(10, 8))
# plt.scatter(X_umap[:, 0], X_umap[:, 1], c=y2, cmap='inferno', s=50, alpha=0.7)
# plt.colorbar(label='Clases')
# plt.title('Reducción de dimensionalidad con UMAP')
# plt.show()
