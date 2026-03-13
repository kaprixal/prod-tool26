import deadlock_api_client
from deadlock_api_client.models.hero_counter_stats import HeroCounterStats
from deadlock_api_client.rest import ApiException
from pprint import pprint

# Defining the host is optional and defaults to https://api.deadlock-api.com
# See configuration.py for a list of all supported configuration parameters.
configuration = deadlock_api_client.Configuration(
    host = "https://api.deadlock-api.com"
)

def get_hero_counters_stats(params=None):
    """
    Calls the AnalyticsApi.hero_counters_stats endpoint with the given params dictionary.
    Prints and returns the API response.
    """
    if params is None:
        params = {
            'game_mode': 'normal',  # Valid: 'normal', 'street_brawl', 'explore_n_y_c'
            'min_unix_timestamp': 1770681600, # a month ago
            'min_average_badge': 101,
            'same_lane_filter': True,
            'min_matches': 20,
        }
    with deadlock_api_client.ApiClient(configuration) as api_client:
        api_instance = deadlock_api_client.AnalyticsApi(api_client)
        try:
            api_response = api_instance.hero_counters_stats(**params)
            print("The response of AnalyticsApi->hero_counters_stats:\n")
            # pprint(api_response)
            return api_response
        except Exception as e:
            print("Exception when calling AnalyticsApi->hero_counters_stats: %s\n" % e)
            return None

def filter_counter_stats(counter_stats_list, hero_id=None, enemy_hero_id=None, min_matches=None, same_lane_filter=True, min_average_badge=None):
    """
    Filters a list of HeroCounterStats objects based on the provided criteria.
    
    Parameters:
    - counter_stats_list: List of HeroCounterStats objects to filter.
    - hero_id: (Optional) Filter by specific hero ID.
    - enemy_hero_id: (Optional) Filter by specific enemy hero ID.
    - min_matches: (Optional) Filter by minimum number of matches.
    - same_lane_filter: (Optional) Filter by same lane criteria.
    
    Returns:
    - A filtered list of HeroCounterStats objects that match the criteria.
    """
    filtered_stats = []
    for item in counter_stats_list:
        if hero_id is not None and getattr(item, 'hero_id', None) != hero_id:
            continue
        if enemy_hero_id is not None and getattr(item, 'enemy_hero_id', None) != enemy_hero_id:
            continue
        if min_matches is not None and getattr(item, 'matches', 0) < min_matches:
            continue
        if same_lane_filter is not None and getattr(item, 'same_lane', True) != same_lane_filter:
            continue
        if min_average_badge is not None and getattr(item, 'average_badge', 0) < min_average_badge:
            continue
        filtered_stats.append(item)
    return filtered_stats
# Example usage:
if __name__ == "__main__":
    p = {
            'game_mode': 'normal',  # Valid: 'normal', 'street_brawl', 'explore_n_y_c'
            'min_unix_timestamp': 1770681600,
            'same_lane_filter': True,
            'min_matches': 20,
            'min_average_badge': 101,
        }
    counter_stats = get_hero_counters_stats(p)
    filtered = filter_counter_stats(counter_stats, hero_id=1)
    pprint(filtered)