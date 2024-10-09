import pandas as pd

# Add multimedia link based on the gbifID
def add_multi(correlation_df, df):
    multi_dict = df.groupby('scientificName')['media'].apply(list).to_dict()
    media_df = pd.DataFrame(list(multi_dict.items()), columns=['scientificName', 'identifier'])
    correlation_df = correlation_df.merge(media_df, on='scientificName', how='left')
    return correlation_df

# Get table with relation between species and regions
def get_species_table(df):
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