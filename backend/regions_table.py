# Get table with relation between species and regions
def get_regions_table(df):
    correlation_df = df.pivot_table(index='hexagon', columns='scientificName', aggfunc='size', fill_value=0)
    correlation_df = correlation_df.reset_index()
    correlation_df.columns.name = None
    return correlation_df
