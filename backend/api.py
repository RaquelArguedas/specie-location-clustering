import numpy as np
import pandas as pd
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

from shared.clustering import umap_adjustment, clustering
from shared.auxiliar import filter_rows_by_sum, filter_columns_by_sum, visualize, obtain_df
from species_table import add_multi, get_species_table, add_extra_info
from regions_table import get_regions_table

app = Flask(__name__)
CORS(app)


cache = {}
bestK_cache = 2
correlation_df_cache = None
df_cache = None

# Retorns species cluster
@app.route('/do_cluster', methods=['POST'])
def do_cluster():
    global cache
    global bestK_cache
    global correlation_df_cache
    global df_cache
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

    df = df_cache = obtain_df(df_cache) 

    print('Other columns added, creating table...')
    correlation_df = get_species_table(df)
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


regions_cache = {}
bestK_regions_cache = 2
correlation_regions_df_cache = None

# Retorns regions cluster
@app.route('/do_cluster_regions', methods=['POST'])
def do_cluster_regions():
    global regions_cache
    global bestK_regions_cache
    global correlation_regions_df_cache
    global df_cache
    type = request.json.get('type')
    params = request.json.get('paramsAPI', {})
    print(type, params)

    if (correlation_regions_df_cache is not None) and (type in regions_cache) and (json.dumps(regions_cache[type], sort_keys=True) == json.dumps(params, sort_keys=True)):
        json_data = {}
        json_data['cluster'] = correlation_regions_df_cache.to_dict(orient='records')
        json_data['bestK'] = bestK_regions_cache
        return jsonify(json_data)
    regions_cache = {}
    regions_cache[type] = params

    df = df_cache = obtain_df(df_cache) 

    print('Other columns added, creating table...')
    correlation_df = get_regions_table(df)

    correlation_df = filter_rows_by_sum(correlation_df, 100) 
    correlation_df = filter_columns_by_sum(correlation_df, 100) 
    print(correlation_df.head())    

    print('Doing clustering...') 
    selected_columns = correlation_df.select_dtypes(include=[np.number]).columns
    umap_embedding = umap_adjustment(correlation_df, selected_columns)
    correlation_df['UMAP1'] = umap_embedding[:, 0]
    correlation_df['UMAP2'] = umap_embedding[:, 1]
    correlation_df['cluster'], bestK = clustering(type, umap_embedding, params) 
    # visualize(correlation_df, 'UMAP1', 'UMAP2', 'cluster')
    
    print('Creating csv...')
    correlation_df.to_csv(os.path.join(os.getcwd(), 'correlation_regions_table.csv'))

    print('Done')

    json_data = {}
    json_data['cluster'] = correlation_df.to_dict(orient='records')
    json_data['bestK'] = bestK
    correlation_regions_df_cache = correlation_df
    bestK_regions_cache = bestK

    return jsonify(json_data)

if __name__ == '__main__':
    app.run(debug=True)