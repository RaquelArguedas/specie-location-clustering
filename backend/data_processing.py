import pandas as pd
from sklearn.cluster import KMeans, KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
import h3
import os
import umap
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from pygbif import occurrences

app = Flask(__name__)
CORS(app)

# Gets the dataset from the module
def get_datasets():
    df = pd.DataFrame()
    total_occurrences = 10200
    batch_size = 300
    for i in range(0, total_occurrences, batch_size):
        res = occurrences.search(offset=i, hasCoordinate=True, continent="EUROPE", kingdomKey=1, classKey=212, mediatype='StillImage')
        temp_df = pd.DataFrame(res['results'])
        if temp_df.empty:
            break
        df = pd.concat([df, temp_df], ignore_index=True)
    return df

# Add multimedia link based on the gbifID
def add_multi(correlation_df, df):
    multi_dict = df.groupby('scientificName')['media'].apply(list).to_dict()
    media_df = pd.DataFrame(list(multi_dict.items()), columns=['scientificName', 'identifier'])
    correlation_df = correlation_df.merge(media_df, on='scientificName', how='left')
    return correlation_df

     
# Add hexagon columns
def add_hexagons(df):
    col = []
    for index, item in df.iterrows():
        cell = h3.latlng_to_cell(item['decimalLatitude'], item['decimalLongitude'], 1)
        col += [cell]
    df['hexagon'] = col

# Get table with relation between species and regions
def get_correlation_table(df):
    correlation_df = df.pivot_table(index='scientificName', columns='hexagon', aggfunc='size', fill_value=0)
    correlation_df = correlation_df.reset_index()
    correlation_df.columns.name = None
    return correlation_df

# Add the info to de df of the desired colum of the original df
def add_extra_info(correlation_df, df, column):
    def get_values(row):
        temp = df[df['scientificName'] == row['scientificName']]
        values = temp[column].value_counts().items()
        return [val for pair in values for val in pair]
    correlation_df[column] = correlation_df.apply(get_values, axis=1)

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

# Scale the df and do the UMAP
def umap_adjustment(df, columns):
    data_scaled = StandardScaler().fit_transform(df[columns])
    X_umap = (umap.UMAP(n_neighbors=15, min_dist=0.2)).fit_transform(data_scaled)
    return X_umap

# Obtains the best k of a df
def get_best_k(type, umap_embedding, params):
    bestK = 2
    maxSil = -2
    for k in range(2, 11):
        clustering = KMeans(n_clusters=k, 
                        init=params.get("init", 'k-means++'), 
                        n_init=params.get("n_init", 'auto'), 
                        max_iter=params.get("max_iter", 300), 
                        tol=params.get("tol", 0.0001), 
                        verbose=params.get("verbose", 0), 
                        random_state=params.get("random_state", None), 
                        copy_x=params.get("copy_x", True), 
                        algorithm=params.get("algorithm", 'lloyd')).fit(umap_embedding) if type == "kmeans" else (
                    AgglomerativeClustering(n_clusters=k, 
                        metric=params.get("metric", 'euclidean'), 
                        memory=params.get("memory", None), 
                        connectivity=params.get("connectivity", None), 
                        compute_full_tree=params.get("compute_full_tree", 'auto'), 
                        linkage=params.get("linkage", 'ward'), 
                        distance_threshold=params.get("distance_threshold", None), 
                        compute_distances=params.get("compute_distances", False)).fit(umap_embedding))
        labels = clustering.labels_
        result = silhouette_score(umap_embedding, labels, metric = 'euclidean')
        if result > maxSil:
            maxSil = result 
            bestK = k
    return bestK

# Does the clustering 
def clustering(type, umap_embedding, params):
    bestK = params.get("n_clusters", None)
    if bestK == None:
        bestK = get_best_k(type, umap_embedding, params) 
    clustering = KMeans(n_clusters=bestK, 
                        init=params.get("init", 'k-means++'), 
                        n_init=params.get("n_init", 'auto'), 
                        max_iter=params.get("max_iter", 300), 
                        tol=params.get("tol", 0.0001), 
                        verbose=params.get("verbose", 0), 
                        random_state=params.get("random_state", None), 
                        copy_x=params.get("copy_x", True), 
                        algorithm=params.get("algorithm", 'lloyd')) if type == "kmeans" else (
                    AgglomerativeClustering(
                        n_clusters=bestK,
                        metric=params.get("metric", 'euclidean'), 
                        memory=params.get("memory", None), 
                        connectivity=params.get("connectivity", None), 
                        compute_full_tree=params.get("compute_full_tree", 'auto'), 
                        linkage=params.get("linkage", 'ward'), 
                        distance_threshold=params.get("distance_threshold", None), 
                        compute_distances=params.get("compute_distances", False)) if type == "hierarquical" else 
                    DBSCAN(eps=params.get("eps", 0.00001),  
                        min_samples=params.get("min_samples", 5), 
                        metric=params.get("metric", 'euclidean'), 
                        metric_params=params.get("metric_params", None), 
                        algorithm=params.get("algorithm", 'auto'), 
                        leaf_size=params.get("leaf_size", 30), 
                        p=params.get("p", None), 
                        n_jobs=params.get("n_jobs", None))
                )
    y2 = clustering.fit_predict(umap_embedding) 
    return y2, bestK


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

cache = {}
bestK_cache = 2
correlation_df_cache = None

# Main() what the API does when it is called
@app.route('/do_cluster', methods=['POST'])
def do_cluster():
    global cache
    global bestK_cache
    global correlation_df_cache
    print('called the backend')
    print('request.json', request.json)
    type = request.json.get('type')
    params = request.json.get('paramsAPI', {})

    print('CACHE BEFORE:', cache)
    if (correlation_df_cache is not None) and (type in cache) and (json.dumps(cache[type], sort_keys=True) == json.dumps(params, sort_keys=True)):
        print('got into cache')
        json_data = {}
        json_data['cluster'] = correlation_df_cache.to_dict(orient='records')
        json_data['bestK'] = bestK_cache
        return jsonify(json_data)
    cache = {}
    cache[type] = params

    print('CACHE AFTER:', cache)

    print(type, params)

    print('Starting...')
    df = get_datasets()
    print('Datasets obtained')

    # reduce to desired columns
    df = df[['gbifID', 'sex', 'lifeStage', 'occurrenceStatus', 'occurrenceRemarks', 'eventDate', 
            'year', 'month', 'day', 'continent', 'countryCode', 'stateProvince', 'decimalLatitude', 
            'decimalLongitude', 'coordinateUncertaintyInMeters', 'identificationID', 'taxonID', 
            'scientificName', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'genericName', 
            'specificEpithet', 'taxonRank', 'media']]
    col = []
    for index, item in df.iterrows():
        col += [(item.to_dict())['media'][0]['identifier']]
    df['media'] = col
    
    # not null values in those columns
    df = df[df['decimalLatitude'].notnull() & df['decimalLongitude'].notnull() & df['scientificName'].notnull()]
    print('Columns and rows reduced')

    print('Adding hexagons column...')
    add_hexagons(df)

    print('Other columns added, creating table...')
    correlation_df = get_correlation_table(df)
    correlation_df = filter_rows_by_sum(correlation_df, 100) 
    correlation_df = filter_columns_by_sum(correlation_df, 100) 

    print('Table done, adding extra info...')
    for column in ['sex', 'lifeStage', 'continent', 'countryCode', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus']:
        add_extra_info(correlation_df, df, column)

    print('Adding media column to table...')
    correlation_df = add_multi(correlation_df, df)

    print('Extra info added, doing clustering...') 
    selected_columns = correlation_df.select_dtypes(include=[np.number]).columns

    umap_embedding = umap_adjustment(correlation_df, selected_columns)
    correlation_df['UMAP1'] = umap_embedding[:, 0]
    correlation_df['UMAP2'] = umap_embedding[:, 1]
    correlation_df['cluster'], bestK = clustering(type, umap_embedding, params) 
    # visualize(correlation_df, 'UMAP1', 'UMAP2', 'cluster')
    
    print('Creating csv...')
    correlation_df.to_csv(os.path.join(os.getcwd(), 'correlation_table.csv'))

    print('Done')

    json_data = {}
    json_data['cluster'] = correlation_df.to_dict(orient='records')
    json_data['bestK'] = bestK
    correlation_df_cache = correlation_df
    bestK_cache = bestK

    print('Best K value:', json_data['bestK'])
    return jsonify(json_data)

if __name__ == '__main__':
    app.run(debug=True)