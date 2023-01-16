// params {{address}}
export const WALLET_BALANCE_QUERY = `with
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
),

net_ins as (
    select
      date(block_timestamp) as date,
      b.mint,
      sum(
  		(
  			case
  			when tx_from = '{{address}}' then -amount 
  			else amount end
  		)
  	) as net_in
	from solana.core.fact_transfers b
    where  (tx_from = '{{address}}' or tx_to = '{{address}}')
    group by 1,2
),

cumulative_min_date as (
  SELECT mint, MIN(date) as min_date
  FROM net_ins
  GROUP BY mint
),
  
date_dim as (select TO_DATE('20210512','YYYYMMDD') date_id  ),
dates AS (
  SELECT DISTINCT
  	date,
  	mint
  FROM (
    SELECT DATEADD(DAY, 1*SEQ4(), date_dim.date_id ) AS date
      FROM date_dim,TABLE(GENERATOR(ROWCOUNT => (1500) )) 
    WHERE date <= CURRENT_DATE
  )
  JOIN cumulative_min_date
  ON date >= min_date
),

token_balances as (
select
  d.date,
  d.mint,
  sum(coalesce(net_in, 0)) over (partition by d.mint order by d.date) as balance
from dates d
left join net_ins b
on d.date = b.date and d.mint = b.mint
group by d.date, d.mint, net_in
qualify balance > 0
)


select
	b.date,
  	b.mint,
  	p.price,
  	upper(p.symbol) as symbol,
  	b.balance,
	b.balance *  nvl(p.price, 0) as balance_usd
from token_balances b
left join prices p
on p.date = b.date and p.token_address = b.mint
order by 1, balance_usd desc`;

export const WALLET_NFT_RANKING_QUERY = `with buy_volume as (
    select 
        purchaser as address,
        'buy' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded
    group by 1
  ),
  
  sell_volume as (
    select 
        seller as address,
        'sell' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded
    group by 1
  ),
  
  address_summaries as (
    select
        address,
        sum(total_volume) as total_volume,
        sum(total_tx) as total_tx,
      sum(case when type = 'buy' then -total_volume else total_volume end) as total_sol_profit -- excluding value of inventory
    from (
      select * from buy_volume
      union
      select * from sell_volume
    )
    group by 1
  ),
  
  address_count as (
    select 
        count(1) as address_count
    from address_summaries
  ),

  ranks as (
    select
        address,
        total_volume,
        total_tx,
          address_count,
        rank() over (order by total_volume desc) as rank_by_volume,
          case
          when rank_by_volume / address_count <= 0.01 then 'Top 1%'
          when rank_by_volume / address_count <= 0.05 then 'Top 5%'
          when rank_by_volume / address_count <= 0.1 then 'Top 10%'
          when rank_by_volume / address_count <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_volume,
        rank() over (order by total_tx desc) as rank_by_tx_count,
          case
          when rank_by_tx_count / address_count <= 0.01 then 'Top 1%'
          when rank_by_tx_count / address_count <= 0.05 then 'Top 5%'
          when rank_by_tx_count / address_count <= 0.1 then 'Top 10%'
          when rank_by_tx_count / address_count <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_tx_count
    from address_summaries join address_count
  )

  select *
  from ranks
  where address = '{{address}}'
      `;

export const WALLET_DEFI_RANKING_QUERY = `with 
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
),

address_summaries as (
  select 
    swapper as address,
    sum(swap_from_amount * p.price) as total_volume,
    count(distinct tx_id) as total_tx
  from solana.core.fact_swaps s
  join prices p
  on p.token_address = s.swap_from_mint and p.date = s.block_timestamp::date
  where succeeded
  group by 1
  order by total_volume desc
),


address_count as (
  select 
  	count(1) as address_count
  from address_summaries
),

ranks as (
  select
      address,
      total_volume,
      total_tx,
        address_count,
      rank() over (order by total_volume desc) as rank_by_volume,
        case
        when rank_by_volume / address_count <= 0.01 then 'Top 1%'
        when rank_by_volume / address_count <= 0.05 then 'Top 5%'
        when rank_by_volume / address_count <= 0.1 then 'Top 10%'
        when rank_by_volume / address_count <= 0.5 then 'Top 50%'
        else 'Bottom 50%' end as tier_by_volume,
      rank() over (order by total_tx desc) as rank_by_tx_count,
        case
        when rank_by_tx_count / address_count <= 0.01 then 'Top 1%'
        when rank_by_tx_count / address_count <= 0.05 then 'Top 5%'
        when rank_by_tx_count / address_count <= 0.1 then 'Top 10%'
        when rank_by_tx_count / address_count <= 0.5 then 'Top 50%'
        else 'Bottom 50%' end as tier_by_tx_count
  from address_summaries join address_count
)

select *
from ranks
where address = '{{address}}'`;

export const WALLET_NFT_VOLUME_QUERY = `with buy_volume as (
    select 
        block_timestamp::date as date,
        'buy' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded and purchaser = '{{address}}'
    group by 1
  ),
  
  sell_volume as (
    select 
        block_timestamp::date as date,
        'sell' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded and seller = '{{address}}'
    group by 1
  )
  
    select 
        *,
        sum(total_sol_profit) over (order by date) as cumulative_sol_profit
    from (
      select
          date,
          sum(total_volume) as total_volume,
          sum(total_tx) as total_tx,
            sum(case when type = 'buy' then -total_volume else total_volume end) as total_sol_profit -- excluding value of inventory
      from (
        select * from buy_volume
        union
        select * from sell_volume
      )
      group by 1
    )
    order by date`;

export const WALLET_DEFI_VOLUME_QUERY = `with 
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
)

  
  select 
  	*,
  	sum(total_volume) over (order by date) as cumulative_volume,
  	sum(total_profit) over (order by date) as cumulative_profit
  from (
    select 
  	  s.block_timestamp::date as date,
      sum(swap_from_amount * p.price) as total_volume,
  	  sum((swap_from_amount * p.price) - (swap_to_amount * p2.price)) as total_profit,
      count(distinct tx_id) as total_tx
    from solana.core.fact_swaps s
    join prices p
    on p.token_address = s.swap_from_mint and p.date = s.block_timestamp::date
    join prices p2
    on p2.token_address = s.swap_to_mint and p2.date = s.block_timestamp::date
    where succeeded and swapper = '{{address}}'
    group by 1
  )
  order by date`;

  export const WALLET_STAKE_SUMMARIES_QUERY = `with stake_accounts as (
    select distinct stake_account
    from solana.core.ez_staking_lp_actions
    where stake_authority = '{{address}}'
  ),
  
  stakes as (
    select
            block_timestamp,
          tx_id,
          index,
          event_type,
          stake_account,
          pre_tx_staked_balance,
          post_tx_staked_balance
    from solana.core.ez_staking_lp_actions
    where stake_account in (select stake_account from stake_accounts)
      and succeeded 
  ),
  
  stake_summaries as (
    select
            block_timestamp::date as date,
          sum(case when event_type in ('delegate', 'merge_destination') then post_tx_staked_balance - pre_tx_staked_balance else 0 end) / 1e9 as total_deposit,
          sum(case when event_type in ('withdraw', 'merge_source') then pre_tx_staked_balance - post_tx_staked_balance else 0 end) / 1e9 as total_withdraw,
          total_deposit - total_withdraw as stake_balance_diff
    from stakes
    group by 1
  )
    
  select
        *,
        sum(stake_balance_diff) over (order by date) as total_stake_balance -- negative means total profit
  from stake_summaries
  order by 1`;