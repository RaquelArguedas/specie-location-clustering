from sklearn.cluster import KMeans, KMeans, DBSCAN, AgglomerativeClustering
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler
import umap
import pandas as pd

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